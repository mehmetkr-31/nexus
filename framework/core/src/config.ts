/**
 * Shared constants for Nexus framework.
 * Import from here instead of duplicating magic numbers across files.
 */

/** Default page size for paginated ACS queries. */
export const DEFAULT_PAGE_SIZE = 100;

/** Default Canton Ledger API timeout in milliseconds. */
export const DEFAULT_TIMEOUT_MS = 30_000;

/** Default WebSocket ping interval in milliseconds. */
export const DEFAULT_WS_PING_INTERVAL_MS = 30_000;
