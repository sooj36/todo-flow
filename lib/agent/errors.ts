// lib/agent/errors.ts

/**
 * Error thrown when API configuration is invalid or missing.
 * These errors should fail fast and NOT trigger retry/fallback logic.
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConfigError);
    }
  }
}
