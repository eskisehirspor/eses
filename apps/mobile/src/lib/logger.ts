type LogContext = Record<string, unknown>;

export const logger = {
  info(message: string, context?: LogContext) {
    console.info(message, context ?? {});
  },
  warn(message: string, context?: LogContext) {
    console.warn(message, context ?? {});
  },
  error(message: string, context?: LogContext) {
    console.error(message, context ?? {});
  },
};

export function toUserErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return fallback;
  }
  return fallback;
}
