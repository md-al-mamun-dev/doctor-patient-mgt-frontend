.PHONY: install dev dev-frontend build start test typecheck lint

install: ## Install dependencies
	pnpm install

dev: ## Run Next.js dev server
	pnpm dev

dev-frontend: dev

build: ## Build Next.js production bundle
	pnpm build

start: ## Start Next.js production server
	pnpm start

test: ## Run Playwright test suite
	pnpm test

test-add-doctor-headed: ## Run Add Doctor test with visible Chromium browser
	pnpm test:add-doctor

typecheck: ## Check TypeScript types
	pnpm typecheck

lint: ## Run ESLint
	pnpm lint

