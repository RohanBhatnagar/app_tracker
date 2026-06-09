const DEFAULT_BACKEND_API_BASE_URL = "http://127.0.0.1:5000";
const DEFAULT_GMAIL_POLL_INTERVAL_MINUTES = 0.5;

const configuredPollInterval = Number(
  process.env.GMAIL_POLL_INTERVAL_MINUTES || DEFAULT_GMAIL_POLL_INTERVAL_MINUTES
);

export const BACKEND_API_BASE_URL =
  process.env.EXTENSION_API_BASE_URL || DEFAULT_BACKEND_API_BASE_URL;
export const BACKEND_API_ORIGIN = new URL(BACKEND_API_BASE_URL).origin;
export const GMAIL_POLL_INTERVAL_MINUTES =
  Number.isFinite(configuredPollInterval) && configuredPollInterval > 0
    ? configuredPollInterval
    : DEFAULT_GMAIL_POLL_INTERVAL_MINUTES;
