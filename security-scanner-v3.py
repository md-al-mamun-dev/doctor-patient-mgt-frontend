#!/usr/bin/env python3
"""
Security Scanner v3 (static repository threat triage)
Specifically engineered to catch:
1. Disguised malicious assets (e.g. JavaScript hiding in .woff2, .ttf, .png, .css)
2. Stealth IDE execution triggers (.vscode/tasks.json with folderOpen, .vscode/settings.json)
3. Ethereum smart-contract C2 loaders (BeaverTail / Lazarus campaign patterns)
4. Obfuscated eval/spawn execution & XOR payload decoders
5. Malicious npm lifecycle hooks and CI/CD pipelines
"""

import re
import sys
import json
import time
import hashlib
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional, Set

# Keep TOML inspection available on macOS's Python 3.9 and on Python 3.10.
try:
    import tomllib
except ModuleNotFoundError:
    try:
        import tomli as tomllib
    except ModuleNotFoundError:
        sys.exit(
            'Security scanner requires Python 3.11+ or the tomli backport. '
            'For Python 3.9/3.10, run: '
            'python3 -m pip install --user -r requirements-security.txt'
        )

# ============================================================================
# Configuration
# ============================================================================

# Code and config extensions always scanned as text
CODE_EXTENSIONS = {
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.json', '.yaml', '.yml', '.env', '.html', '.svg',
    '.py', '.sh', '.bash', '.zsh', '.rs', '.toml', '.gradle',
    '.properties', '.pbxproj', '.podspec', '.rb', '.ps1', '.bat',
    '.cmd', '.hcl', '.ini', '.cfg', '.lock'
}

# Binary asset extensions to check for spoofing / hidden scripts
ASSET_EXTENSIONS = {
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico',
    '.pdf', '.mp3', '.mp4', '.zip'
}

# Directories to strictly exclude (to prevent scanning massive dependencies)
EXCLUDE_DIRS = {
    'node_modules', '.git', 'dist', 'dist-docker', 'build', 'coverage',
    '.next', 'out', 'vendor', 'bower_components',
    'security-scan-results', 'playwright-report', 'test-results',
    '__pycache__', '.pytest_cache', 'generated'
}

# Allowed dot-directories that MUST be scanned for security threats
ALLOWED_DOT_DIRS = {
    '.vscode', '.github', '.husky', '.githooks', '.devcontainer', '.cargo'
}

EXCLUDE_FILES = {
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    'security-scanner.py', 'security-scanner-v2.py', 'security-scanner-v3.py',
    'security-scan.js', 'security-scan.cjs', 'security-scan.mjs',
    'run-deployment-v4.sh', 'deploy-backend.sh', 'run-frontend-deployment.sh',
    'test-tutor-flow.ts', 'deploy-backend.yml', 'conftest.py'
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_BINARY_HASH_SIZE = 100 * 1024 * 1024
LOCKFILES = {'package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml',
             'yarn.lock', 'Cargo.lock', 'poetry.lock', 'uv.lock', 'Pipfile.lock',
             'Podfile.lock', 'Gemfile.lock'}
BINARY_EXTENSIONS = {'.exe', '.dll', '.so', '.dylib', '.node', '.jar', '.wasm',
                     '.class', '.apk', '.ipa', '.a', '.o'}
EXECUTABLE_MAGIC = {'.exe': (b'MZ',), '.dll': (b'MZ',),
                    '.so': (b'\x7fELF',), '.node': (b'\x7fELF', b'MZ',
                    b'\xfe\xed\xfa\xce', b'\xcf\xfa\xed\xfe',
                    b'\xca\xfe\xba\xbe'),
                    '.wasm': (b'\x00asm',), '.class': (b'\xca\xfe\xba\xbe',),
                    '.jar': (b'PK\x03\x04',), '.apk': (b'PK\x03\x04',)}
REMOTE_SOURCE = re.compile(r'(?i)(?:git\+(?:https?|ssh)://|\bgit@[a-z0-9._-]+:[^\s]+|(?:https?://|ssh://)[^\s"\x27]+(?:\.git|\.(?:tgz|tar\.gz|whl|zip))(?:\b|$)|\b(?:file|link):(?:\.\.?/|/))')
DOWNLOAD = re.compile(r'(?i)\b(?:curl|wget|Invoke-WebRequest|urllib\.request|requests\.(?:get|post)|axios\.(?:get|post)|fetch\s*\()\b|\b(?:curl|wget)\b')
SHELL = re.compile(r'(?i)\b(?:bash|sh|powershell|pwsh|cmd|node|python3?|osascript)\b|\b(?:eval|exec|spawn|system|popen)\s*\(')
DECODE = re.compile(r'(?i)(?:base64|atob\s*\(|fromCharCode|Buffer\.from\([^\n]*base64|zlib|gzip|\bxor\b|\\x[0-9a-f]{2})')
SECRETS = re.compile(r'(?i)(?:process\.env|os\.environ|\.env\b|\.ssh\b|\.aws\b|\.npmrc\b|\.pypirc\b|credentials\s*[:=]\s*["\x27`]|credentials\.[a-z0-9_]+|credentials\b(?!\s*:\s*(?:true|false)\b)|private[_ -]?key|GITHUB_TOKEN|AWS_SECRET_ACCESS_KEY|browser.*(?:cookie|storage)|wallet)')
OUTBOUND = re.compile(r'(?i)\b(?:fetch|axios|requests|urllib|httpx|https?\.request|net\.connect|socket|curl|wget|Invoke-WebRequest|WebSocket)\b')
PIPE_TO_SHELL = re.compile(r'(?i)(?:curl|wget|Invoke-WebRequest)[^\n]{0,300}\|\s*(?:ba)?sh\b|(?:curl|wget)[^\n]{0,300}\|\s*(?:powershell|pwsh|python3?|node)\b')

# Known Magic Bytes for real binary assets
MAGIC_BYTES = {
    '.woff2': b'wOF2',
    '.woff': b'wOFF',
    '.ttf': b'\x00\x01\x00\x00',
    '.png': b'\x89PNG\r\n\x1a\n',
    '.jpg': b'\xff\xd8\xff',
    '.jpeg': b'\xff\xd8\xff',
    '.gif': b'GIF8',
    '.pdf': b'%PDF'
}

# ============================================================================
# Detection Patterns (Targeted for Supply Chain Attacks & Trojans)
# ============================================================================

PATTERNS = {
    # C2 / Blockchain Loader Patterns
    'ethereum_rpc': re.compile(r'eth_getBlockByNumber|eth_getTransactionCount|eth_blockNumber|eth_getTransactionByHash', re.I),
    'ethereum_endpoint': re.compile(r'1rpc\.io/eth|eth\.drpc\.org|publicnode\.com|blastapi\.io|blockscout\.com', re.I),
    'ethereum_address': re.compile(r'0x[a-fA-F0-9]{40}\b'),
    'payload_header': re.compile(r'x-payload-[a-z0-9-]+', re.I),
    'xor_decoding': re.compile(r'\^=\s*[^;]+\.charCodeAt\s*\(|\.charCodeAt\([^)]+\)\s*\^', re.I),
    
    # Execution & Evasion Patterns
    'eval_dynamic': re.compile(r'\beval\s*\(|\bFunction\s*\(|new\s+Function'),
    'detached_spawn': re.compile(r'spawn\s*\([^)]*\{[^}]*detached\s*:\s*!*0|windowsHide\s*:\s*!*0', re.I),
    'child_process': re.compile(r'\b(?:exec|spawn|fork)\s*\([^)]*(?:sh|bash|cmd|powershell|node|\.woff|\.ttf)', re.I),
    'global_manipulation': re.compile(r'global\[[\'"][^\'"]+[\'"]\]\s*=\s*require|global\.r\s*=\s*require', re.I),
    'suspicious_var_arrays': re.compile(r'const\s+_0x[a-f0-9]+\s*=\s*_0x[a-f0-9]+|var\s+_0x[a-f0-9]+\s*=', re.I),
    'math_obfuscation': re.compile(r'(?:0x[a-f0-9]+\s*[\*\+\-\/]\s*)+0x[a-f0-9]+', re.I),
    'hex_escapes': re.compile(r'\\x[0-9a-fA-F]{2}'),
    'long_unbroken_lines': re.compile(r'[^\n]{5000,}'),
    'tab_indent_obfuscation': re.compile(r'^\t{50,}', re.M),
}

# ============================================================================
# Threat Finding Class
# ============================================================================

class ThreatFinding:
    def __init__(self, file_path: Path, category: str, severity: str, description: str, snippet: str = ""):
        self.file_path = file_path
        self.category = category
        self.severity = severity
        self.description = description
        self.snippet = snippet

# ============================================================================
# Scanner Engine
# ============================================================================

class AdvancedSecurityScanner:
    def __init__(self, root_dir: str = '.', min_severity: str = 'HIGH', ignored_categories: Optional[Set[str]] = None):
        self.root_dir = Path(root_dir).resolve()
        self.min_severity = min_severity.upper()
        self.ignored_categories = {c.upper() for c in (ignored_categories or set())}
        self.findings: List[ThreatFinding] = []
        self.scanned_count = 0
        self.skipped_count = 0

    def run(self) -> int:
        print("=" * 80)
        print(f"🛡️  REPOSITORY SECURITY SCANNER v3: Starting scan on {self.root_dir}")
        print("=" * 80)
        start_time = time.time()

        self._walk_and_scan(self.root_dir)
        self._scan_vscode_configurations()

        elapsed = time.time() - start_time
        return self._print_report(elapsed)

    def _walk_and_scan(self, current_dir: Path):
        try:
            for entry in current_dir.iterdir():
                if entry.is_symlink():
                    try:
                        target = entry.resolve(strict=True)
                        if not target.is_relative_to(self.root_dir):
                            self._add(entry, 'EXTERNAL_SYMLINK', 'HIGH',
                                      'Symlink points outside the repository; review before following it.')
                    except (OSError, RuntimeError):
                        self._add(entry, 'BROKEN_SYMLINK', 'LOW', 'Broken or cyclic symlink.')
                    continue
                if entry.is_dir():
                    # Process directory if not excluded, allowing whitelist dot-dirs
                    if entry.name in EXCLUDE_DIRS:
                        continue
                    if entry.name == '_' and entry.parent.name == '.husky':
                        continue
                    if entry.name.startswith('.') and entry.name not in ALLOWED_DOT_DIRS:
                        continue
                    self._walk_and_scan(entry)
                elif entry.is_file():
                    if entry.name in EXCLUDE_FILES:
                        continue
                    self._analyze_file(entry)
        except OSError:
            self.skipped_count += 1

    def _analyze_file(self, file_path: Path):
        ext = file_path.suffix.lower()
        name = file_path.name
        if name == Path(__file__).name and file_path.resolve() == Path(__file__).resolve():
            return

        if ext in BINARY_EXTENSIONS or name in {'gradle-wrapper.jar', 'gradlew'}:
            self.scanned_count += 1
            self._check_executable(file_path)
            if name != 'gradlew':
                return

        if name in LOCKFILES:
            self.scanned_count += 1
            self._check_lockfile(file_path)
            return

        # 1. Check if an asset is masquerading as binary (Spoofed File Attack)
        if ext in ASSET_EXTENSIONS:
            self.scanned_count += 1
            self._check_asset_spoofing(file_path, ext)
            return

        # 2. Check source/config files
        if ext in CODE_EXTENSIONS or (name.startswith('requirements') and ext == '.txt') or name in {'.env', 'Dockerfile', 'Makefile',
                'Procfile', 'gradlew', 'Podfile', '.npmrc', '.gitmodules',
                '.pnpmfile.cjs', 'pnpmfile.cjs', '.yarnrc', 'Gemfile', 'config',
                'pip.conf', 'gradlew.bat'} or name.startswith('Dockerfile.'):
            self.scanned_count += 1
            self._check_code_file(file_path)
            return

        self.skipped_count += 1

    def _check_asset_spoofing(self, file_path: Path, ext: str):
        """Checks if a font/image file is actually an ASCII / JavaScript Trojan."""
        try:
            with open(file_path, 'rb') as f:
                header = f.read(512)

            # Check magic bytes if known
            expected_magic = MAGIC_BYTES.get(ext)
            is_valid_magic = False
            if expected_magic and header.startswith(expected_magic):
                is_valid_magic = True

            # Check if file is primarily ASCII / printable text or contains tab obfuscation
            is_ascii = False
            try:
                text_preview = header.decode('utf-8', errors='strict')
                # If it cleanly decoded as utf-8, check if it's text/script
                if '\t' in text_preview or 'function' in text_preview or 'var ' in text_preview or 'global' in text_preview:
                    is_ascii = True
            except UnicodeDecodeError:
                pass

            if not is_valid_magic and is_ascii:
                # File claims to be an asset but is actually a script!
                full_text = file_path.read_text(encoding='utf-8', errors='ignore')
                self.findings.append(ThreatFinding(
                    file_path=file_path,
                    category="SPOOFED_ASSET_TROJAN",
                    severity="CRITICAL",
                    description=f"File extension '{ext}' is masquerading as a binary asset but contains plain text / JavaScript code!",
                    snippet=full_text[:300].strip()
                ))
                # Run pattern scan on the disguised file
                self._scan_text_patterns(file_path, full_text)

            # Preserve the original signature and catch scripts using const/import/require.
            elif expected_magic and not is_valid_magic:
                preview = header.decode('utf-8', errors='ignore')
                if re.search(r'(?m)^\s*(?:#!|const\s|let\s|import\s|export\s|require\s*\(|<script|from\s+\w+\s+import\s)', preview):
                    self._add(file_path, 'SPOOFED_ASSET_TROJAN', 'CRITICAL',
                              f'Invalid {ext} header and source-code syntax in purported asset.')
                    if file_path.stat().st_size <= MAX_FILE_SIZE:
                        self._scan_text_patterns(file_path, file_path.read_text(encoding='utf-8', errors='ignore'))

        except Exception:
            self.skipped_count += 1

    def _check_code_file(self, file_path: Path):
        """Scans code files for obfuscation and malware patterns."""
        try:
            stat = file_path.stat()
            if stat.st_size > MAX_FILE_SIZE:
                self.skipped_count += 1
                return

            content = file_path.read_text(encoding='utf-8', errors='ignore')
            self._scan_text_patterns(file_path, content)
            self._check_execution_surface(file_path, content)
        except Exception:
            self.skipped_count += 1

    def _add(self, path: Path, category: str, severity: str, description: str, snippet: str = ''):
        category_upper = category.upper()
        if category_upper in self.ignored_categories:
            return
        severity_order = {'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4}
        if severity_order.get(severity.upper(), 1) < severity_order.get(self.min_severity, 1):
            return
        self.findings.append(ThreatFinding(path, category, severity, description, snippet[:160]))

    def _check_executable(self, path: Path):
        try:
            if path.stat().st_size > MAX_BINARY_HASH_SIZE:
                self.skipped_count += 1
                return
            digest = hashlib.sha256()
            with path.open('rb') as stream:
                header = stream.read(16)
                digest.update(header)
                for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                    digest.update(chunk)
            suffix = path.suffix.lower()
            if path.name == 'gradlew':
                return
            self._add(path, 'EXECUTABLE_BINARY_IN_REPOSITORY', 'MEDIUM',
                      f'Executable binary needs provenance review (SHA-256: {digest.hexdigest()}).')
            expected = EXECUTABLE_MAGIC.get(suffix)
            if expected and not any(header.startswith(magic) for magic in expected):
                self._add(path, 'EXECUTABLE_FORMAT_MISMATCH', 'HIGH',
                          'Executable extension does not match expected file header.')
        except OSError:
            self.skipped_count += 1

    def _check_lockfile(self, path: Path):
        try:
            if path.stat().st_size > MAX_FILE_SIZE:
                self.skipped_count += 1
                return
            content = path.read_text(encoding='utf-8', errors='replace')
            # Lockfiles are metadata: do not apply source-code signatures to them.
            for pattern, category, severity in [
                (re.compile(r'(?im)(?:resolved|tarball|url|registry|source)\s*[=:]\s*["\x27]?http://[^\s"\x27]+'), 'INSECURE_DEPENDENCY_SOURCE', 'HIGH'),
                (REMOTE_SOURCE, 'NON_REGISTRY_DEPENDENCY_SOURCE', 'MEDIUM'),
            ]:
                match = pattern.search(content)
                if match:
                    self._add(path, category, severity, 'Lockfile contains a dependency source needing review.')
            if path.name in {'package-lock.json', 'npm-shrinkwrap.json', 'Pipfile.lock'}:
                try:
                    json.loads(content)
                except json.JSONDecodeError:
                    self._add(path, 'INVALID_LOCKFILE', 'MEDIUM', 'Lockfile is not valid JSON.')
        except OSError:
            self.skipped_count += 1

    def _check_execution_surface(self, path: Path, content: str):
        name = path.name
        parts = path.relative_to(self.root_dir).parts
        if name == 'package.json':
            try:
                manifest = json.loads(content)
                scripts = manifest.get('scripts', {})
                if isinstance(scripts, dict):
                    for key, command in scripts.items():
                        if not isinstance(command, str):
                            continue
                        if key in {'preinstall', 'install', 'postinstall', 'prepare',
                                   'preprepare', 'postprepare', 'prepublish', 'prepack'}:
                            safe_commands = {'husky', 'npx husky', 'python3 security-scanner-v2.py', 'python3 security-scanner-v3.py', 'node security-scan.js'}
                            if command.strip() not in safe_commands:
                                self._add(path, 'NPM_LIFECYCLE_SCRIPT', 'MEDIUM',
                                          f'Automatic npm lifecycle script: {key}; inspect its command and referenced files.')
                        self._check_command(path, command, f'npm script {key}')
                for section in ('dependencies', 'devDependencies', 'optionalDependencies', 'overrides'):
                    deps = manifest.get(section, {})
                    if isinstance(deps, dict):
                        for dep, source in deps.items():
                            if isinstance(source, str) and (REMOTE_SOURCE.search(source) or source.startswith('http:')):
                                self._add(path, 'NON_REGISTRY_DEPENDENCY_SOURCE', 'MEDIUM',
                                          f'{section} entry {dep} uses a direct or local dependency source.')
            except json.JSONDecodeError:
                self._add(path, 'INVALID_PACKAGE_MANIFEST', 'MEDIUM', 'package.json is not valid JSON.')

        if name in {'.npmrc', '.yarnrc', '.yarnrc.yml', 'pip.conf', 'pip.ini'}:
            if re.search(r'(?im)(?:registry|index-url|extra-index-url|find-links)\s*[:=]\s*https?://', content):
                self._add(path, 'CUSTOM_PACKAGE_REGISTRY', 'MEDIUM', 'Package manager points to a configured registry or index.')
            if re.search(r'(?im)(?:strict-ssl|verify-ssl)\s*[:=]\s*false\b', content):
                self._add(path, 'PACKAGE_TLS_DISABLED', 'HIGH', 'Package manager TLS verification is disabled.')

        if name in {'pyproject.toml', 'Cargo.toml', 'config.toml'}:
            try:
                data = tomllib.loads(content)
                if name == 'pyproject.toml':
                    build = data.get('build-system', {})
                    if build:
                        self._add(path, 'PYTHON_BUILD_BACKEND', 'LOW',
                                  f'Python package build loads backend {build.get("build-backend", "default")}; review build requirements.')
                        for source in build.get('requires', []):
                            if isinstance(source, str) and REMOTE_SOURCE.search(source):
                                self._add(path, 'NON_REGISTRY_DEPENDENCY_SOURCE', 'MEDIUM', 'Python build dependency uses a direct source.')
                elif name == 'Cargo.toml':
                    if data.get('lib', {}).get('proc-macro') is True:
                        self._add(path, 'RUST_PROC_MACRO', 'MEDIUM', 'Procedural macro code executes at compile time.')
                    if data.get('package', {}).get('build') is not False and (path.parent / 'build.rs').exists():
                        self._add(path, 'RUST_BUILD_SCRIPT', 'MEDIUM', 'Cargo runs build.rs during compilation.')
                    if REMOTE_SOURCE.search(content) or re.search(r'(?m)^\s*git\s*=\s*"', content):
                        self._add(path, 'NON_REGISTRY_DEPENDENCY_SOURCE', 'MEDIUM', 'Cargo manifest contains a Git or direct dependency source.')
                elif '.cargo' in parts:
                    for section in ('build', 'target', 'source', 'registries', 'alias'):
                        if section in data:
                            self._add(path, 'CARGO_EXECUTION_CONFIGURATION', 'MEDIUM',
                                      f'Cargo {section} configuration can affect commands, toolchain, or dependency sources.')
            except (tomllib.TOMLDecodeError, TypeError):
                self._add(path, 'INVALID_TOML', 'LOW', 'TOML could not be parsed.')

        if name == 'build.rs':
            self._add(path, 'RUST_BUILD_SCRIPT', 'MEDIUM', 'Cargo may execute this build script during compilation.')
        if name in {'setup.py', 'conftest.py', 'sitecustomize.py', 'noxfile.py'}:
            self._add(path, 'PYTHON_AUTO_EXECUTION_SURFACE', 'MEDIUM',
                      f'{name} may execute during package build, tests, or interpreter/tool startup.')
        if name.startswith('requirements') and path.suffix == '.txt':
            if re.search(r'(?im)^\s*(?:-e\s+|--(?:extra-index-url|index-url|find-links)\b|(?:git\+|https?://|file://))', content):
                self._add(path, 'PYTHON_DEPENDENCY_SOURCE', 'MEDIUM', 'Requirements use an editable, URL, VCS, or custom index source.')
        if name == '.gitmodules' and re.search(r'(?m)^\s*url\s*=', content):
            self._add(path, 'GIT_SUBMODULE_SOURCE', 'MEDIUM', 'Review submodule URLs and pinned commits.')

        if '.github' in parts and ('workflows' in parts or 'actions' in parts):
            self._check_workflow(path, content)
        if '.devcontainer' in parts and name == 'devcontainer.json':
            for key in ('initializeCommand', 'onCreateCommand', 'updateContentCommand',
                        'postCreateCommand', 'postStartCommand', 'postAttachCommand'):
                if re.search(r'"' + key + r'"\s*:', content):
                    self._add(path, 'DEVCONTAINER_AUTO_COMMAND', 'MEDIUM', f'Devcontainer {key} runs commands during container lifecycle.')
        if name.startswith('Dockerfile') or name in {'compose.yml', 'compose.yaml', 'docker-compose.yml', 'docker-compose.yaml'}:
            if re.search(r'(?im)^\s*ADD\s+https?://', content):
                self._add(path, 'DOCKER_REMOTE_ADD', 'MEDIUM', 'Dockerfile downloads a remote file during build.')
            if re.search(r'(?im)(?:privileged\s*:\s*true|/var/run/docker\.sock|network_mode\s*:\s*host)', content):
                self._add(path, 'DOCKER_HOST_ACCESS', 'HIGH', 'Container configuration grants privileged or host access.')
        if name in {'gradlew', 'gradlew.bat', 'build.gradle', 'settings.gradle', 'build.gradle.kts', 'settings.gradle.kts'}:
            self._add(path, 'GRADLE_EXECUTION_SURFACE', 'LOW', f'{name} can execute code as part of a Gradle build.')
        if name == 'project.pbxproj' and 'shellScript' in content:
            self._add(path, 'XCODE_RUN_SCRIPT', 'MEDIUM', 'Xcode project contains a Run Script build phase.')
        if name in {'Podfile', 'Podfile.lock'} or path.suffix == '.podspec':
            if re.search(r'(?i)(?:script_phase|prepare_command|post_install|pre_install)', content):
                self._add(path, 'COCOAPODS_BUILD_HOOK', 'MEDIUM', 'CocoaPods install/build hook requires review.')
        if '.husky' in parts or '.githooks' in parts or name in {'Makefile', 'Procfile'} or 'ci_scripts' in parts:
            self._add(path, 'AUTOMATIC_COMMAND_SURFACE', 'LOW', 'Git hook, task, or build script contains executable commands.')
        if name in {'Dockerfile', 'Makefile', 'gradlew'} or name.endswith(('.sh', '.ps1', '.bat')):
            self._check_command(path, content, name)

    def _check_command(self, path: Path, command: str, surface: str):
        if PIPE_TO_SHELL.search(command):
            self._add(path, 'REMOTE_SCRIPT_EXECUTION', 'HIGH', f'{surface} downloads and runs a remote script.')
        if DECODE.search(command) and SHELL.search(command):
            self._add(path, 'DECODE_AND_EXECUTE', 'HIGH', f'{surface} combines decoding and command execution.')

    def _check_workflow(self, path: Path, content: str):
        if re.search(r'(?m)^\s*pull_request_target\s*:', content) and re.search(r'(?i)actions/checkout|\brun\s*:', content):
            self._add(path, 'PRIVILEGED_PR_WORKFLOW', 'HIGH', 'pull_request_target workflow runs steps; review checkout ref and trust boundary.')
        if re.search(r'(?m)^\s*(?:workflow_run|issue_comment|repository_dispatch)\s*:', content):
            self._add(path, 'PRIVILEGED_EVENT_WORKFLOW', 'MEDIUM', 'Workflow runs on an event that needs trust-boundary review.')
        if re.search(r'(?m)^\s*-?\s*run\s*:\s*.*\$\{\{\s*github\.(?:event|head_ref|ref_name)', content):
            self._add(path, 'WORKFLOW_EXPRESSION_IN_SHELL', 'HIGH', 'GitHub event expression is interpolated directly into a shell command.')
        if re.search(r'(?m)^\s*permissions\s*:\s*write-all\b|^\s*contents\s*:\s*write\b', content):
            self._add(path, 'BROAD_WORKFLOW_PERMISSIONS', 'MEDIUM', 'Workflow requests writable token permissions.')
        for action in re.findall(r'(?m)^\s*-?\s*uses\s*:\s*["\x27]?([^\s"\x27#]+)', content):
            if action.startswith(('./', 'docker://')):
                continue
            is_pinned_sha = bool(re.fullmatch(r'[^@]+@[a-f0-9]{40}', action))
            # Standard trusted publishers using semantic version tags (e.g. actions/checkout@v4)
            is_valid_version_tag = bool(re.fullmatch(r'(?:actions|docker|pnpm|appleboy)/[^@]+@v?[0-9]+(?:\.[0-9]+)*', action))
            if not is_pinned_sha and not is_valid_version_tag:
                self._add(path, 'UNPINNED_GITHUB_ACTION', 'MEDIUM', f'Action {action} is not pinned to a full commit SHA or trusted version tag.')
        self._check_command(path, content, 'workflow')

    def _scan_text_patterns(self, file_path: Path, content: str):
        """Scans string content against backdoor & trojan signatures."""
        # Pair behaviors in a short window: either action alone is common in legitimate projects.
        if file_path.suffix.lower() in {'.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
                                         '.py', '.sh', '.bash', '.zsh', '.rs', '.rb', '.ps1'}:
            for window in (content[i:i + 600] for i in range(0, len(content), 400)):
                if SECRETS.search(window) and OUTBOUND.search(window):
                    self._add(file_path, 'POSSIBLE_CREDENTIAL_EXFILTRATION', 'HIGH',
                              'Credential access and outbound network behavior appear near each other; manually review data flow.')
                    break
            if PIPE_TO_SHELL.search(content):
                self._add(file_path, 'REMOTE_SCRIPT_EXECUTION', 'HIGH', 'Source contains a download piped into an interpreter.')
            elif DOWNLOAD.search(content) and DECODE.search(content) and SHELL.search(content):
                self._add(file_path, 'DOWNLOADED_PAYLOAD_EXECUTION', 'HIGH',
                          'Download, decoding, and execution indicators occur in the same source file; review data flow.')
            if re.search(r'(?im)(?:launchctl\s+(?:load|bootstrap)|crontab\s+-|schtasks\s+/create|systemctl\s+enable|(?:HKCU|HKLM)\\Software\\Microsoft\\Windows\\CurrentVersion\\Run)', content):
                self._add(file_path, 'PERSISTENCE_MECHANISM', 'HIGH', 'Source refers to an OS persistence mechanism.')

        if PATTERNS['ethereum_rpc'].search(content) or PATTERNS['ethereum_endpoint'].search(content):
            self.findings.append(ThreatFinding(
                file_path=file_path,
                category="BLOCKCHAIN_C2_LOADER",
                severity="CRITICAL",
                description="Detected Ethereum RPC calls / smart-contract C2 loader patterns (BeaverTail / Lazarus signature).",
                snippet=self._extract_snippet(content, PATTERNS['ethereum_rpc'])
            ))

        if PATTERNS['payload_header'].search(content) and PATTERNS['xor_decoding'].search(content):
            self.findings.append(ThreatFinding(
                file_path=file_path,
                category="XOR_PAYLOAD_DECODER",
                severity="CRITICAL",
                description="Detected XOR decoding loop fetching x-payload headers.",
                snippet=self._extract_snippet(content, PATTERNS['xor_decoding'])
            ))

        if PATTERNS['global_manipulation'].search(content):
            self.findings.append(ThreatFinding(
                file_path=file_path,
                category="GLOBAL_REQUIRE_HOOK",
                severity="HIGH",
                description="Detected global module/require hijacking (e.g. global.r = require).",
                snippet=self._extract_snippet(content, PATTERNS['global_manipulation'])
            ))

        if PATTERNS['detached_spawn'].search(content) and PATTERNS['eval_dynamic'].search(content):
            self.findings.append(ThreatFinding(
                file_path=file_path,
                category="STEALTH_DETACHED_EXECUTION",
                severity="CRITICAL",
                description="Detected detached hidden node execution combined with eval().",
                snippet=self._extract_snippet(content, PATTERNS['detached_spawn'])
            ))

        if PATTERNS['tab_indent_obfuscation'].search(content):
            self.findings.append(ThreatFinding(
                file_path=file_path,
                category="TAB_INDENT_OBFUSCATION",
                severity="HIGH",
                description="Detected extreme tab indentation used to push malicious code out of standard viewports.",
                snippet="Line starts with over 50 consecutive tab characters."
            ))

        # Obfuscation array patterns
        hex_count = len(PATTERNS['hex_escapes'].findall(content))
        math_count = len(PATTERNS['math_obfuscation'].findall(content))
        if hex_count > 10 and math_count > 5:
            self.findings.append(ThreatFinding(
                file_path=file_path,
                category="HEAVY_STRING_OBFUSCATION",
                severity="HIGH",
                description=f"Detected heavy hexadecimal array obfuscation ({hex_count} hex escapes, {math_count} obfuscated math expressions).",
                snippet=""
            ))

    def _scan_vscode_configurations(self):
        """Inspects .vscode/tasks.json and .vscode/settings.json for stealth execution triggers."""
        vscode_dir = self.root_dir / '.vscode'
        if not vscode_dir.exists():
            return

        # 1. Inspect tasks.json
        tasks_file = vscode_dir / 'tasks.json'
        if tasks_file.exists():
            try:
                content = tasks_file.read_text(encoding='utf-8', errors='ignore')
                if 'folderOpen' in content:
                    self.findings.append(ThreatFinding(
                        file_path=tasks_file,
                        category="VSCODE_AUTO_EXECUTION_TRIGGER",
                        severity="CRITICAL",
                        description="Task configured with 'runOn: folderOpen'. Silently triggers commands when workspace is opened!",
                        snippet=content
                    ))
                if re.search(r'\bnode\s+[\.\/]+[^\s]+\.(woff2?|ttf|png|jpg|svg)', content, re.I):
                    self.findings.append(ThreatFinding(
                        file_path=tasks_file,
                        category="VSCODE_ASSET_EXECUTION",
                        severity="CRITICAL",
                        description="VS Code task attempts to execute an asset/font file with Node.js!",
                        snippet=content
                    ))
            except Exception:
                pass

        # 2. Inspect settings.json
        settings_file = vscode_dir / 'settings.json'
        if settings_file.exists():
            try:
                content = settings_file.read_text(encoding='utf-8', errors='ignore')
                if 'task.allowAutomaticTasks' in content and 'true' in content:
                    self.findings.append(ThreatFinding(
                        file_path=settings_file,
                        category="VSCODE_STEALTH_SETTING",
                        severity="HIGH",
                        description="Setting 'task.allowAutomaticTasks: true' allows background tasks to run without user prompt!",
                        snippet="task.allowAutomaticTasks: true"
                    ))
                if 'terminal.integrated.hideOnStartup' in content and 'always' in content:
                    self.findings.append(ThreatFinding(
                        file_path=settings_file,
                        category="VSCODE_STEALTH_SETTING",
                        severity="MEDIUM",
                        description="Setting 'terminal.integrated.hideOnStartup: always' conceals the terminal window during execution.",
                        snippet="terminal.integrated.hideOnStartup: always"
                    ))
            except Exception:
                pass

    def _extract_snippet(self, content: str, pattern: re.Pattern) -> str:
        match = pattern.search(content)
        if not match:
            return ""
        start = max(0, match.start() - 50)
        end = min(len(content), match.end() + 100)
        return content[start:end].replace('\n', ' ').strip()

    def _print_report(self, elapsed: float):
        print("\n" + "=" * 80)
        print("📊 SCAN RESULTS")
        print("=" * 80)
        print(f"⏱️  Scan completed in {elapsed:.2f} seconds")
        print(f"📁 Files scanned: {self.scanned_count}")
        print(f"📁 Files skipped: {self.skipped_count}")
        print(f"🚨 Threats identified: {len(self.findings)}")

        if not self.findings:
            print("\n✅ Clean! No supply chain trojans, asset spoofing, or stealth IDE triggers detected.\n")
            print("=" * 80)
            return

        print("\n" + "!" * 80)
        print("🚨 THREAT DETAILS:")
        print("!" * 80)

        for idx, finding in enumerate(self.findings, 1):
            rel_path = finding.file_path.relative_to(self.root_dir)
            print(f"\n[{idx}] [{finding.severity}] {finding.category}")
            print(f"    📄 File: {rel_path}")
            print(f"    ⚠️  Details: {finding.description}")
            if finding.snippet:
                print(f"    🔎 Snippet: {finding.snippet[:160]}...")

        print("\n" + "=" * 80)
        print("❌ Scan finished with security warnings. Remediation required.")
        print("=" * 80 + "\n")


# ============================================================================
# CLI Entrypoint
# ============================================================================

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Security Scanner v3 (Repository Threat & Supply Chain Triage)")
    parser.add_argument('target', nargs='?', default='.', help="Target root directory to scan (default: current directory)")
    parser.add_argument('--severity', default='HIGH', choices=['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
                        help="Minimum severity threshold to report/exit on (default: HIGH)")
    parser.add_argument('--ignore-category', action='append', default=[],
                        help="Categories of findings to ignore (e.g. UNPINNED_GITHUB_ACTION, NODE_EXECUTABLE_CONFIG)")
    parser.add_argument('--allow-unpinned-actions', action='store_true',
                        help="Shortcut to ignore UNPINNED_GITHUB_ACTION findings")

    args = parser.parse_args()

    ignored = set(args.ignore_category)
    if args.allow_unpinned_actions:
        ignored.add('UNPINNED_GITHUB_ACTION')

    scanner = AdvancedSecurityScanner(args.target, min_severity=args.severity, ignored_categories=ignored)
    scanner.run()
    sys.exit(1 if scanner.findings else 0)
