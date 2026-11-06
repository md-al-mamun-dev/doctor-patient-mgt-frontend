/**
 * A tiny bridge between the fetch client (plain TypeScript) and the app
 * (router, query cache). ApiProvider registers the real handlers on mount.
 */

type Handlers = {
  /** The session is over: refresh failed or the server rejected it. */
  sessionEnded: () => void;
  /** The API says the user must set a new password first. */
  passwordChangeRequired: () => void;
};

const noop = () => {};
let handlers: Handlers = { sessionEnded: noop, passwordChangeRequired: noop };

// Many requests can fail at once when a session ends; react once.
const DEDUPE_MS = 2_000;
let lastEnded = 0;

export const sessionEvents = {
  /** Registers handlers and returns a cleanup function (handy as a useEffect return). */
  register(next: Partial<Handlers>): () => void {
    handlers = { ...handlers, ...next };
    return () => {
      handlers = { sessionEnded: noop, passwordChangeRequired: noop };
    };
  },

  sessionEnded(): void {
    const now = Date.now();
    if (now - lastEnded < DEDUPE_MS) return;
    lastEnded = now;
    handlers.sessionEnded();
  },

  passwordChangeRequired(): void {
    handlers.passwordChangeRequired();
  },
};
