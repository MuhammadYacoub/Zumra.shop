export interface LogContext {
  correlationId?: string;
  context?: string;
  [key: string]: unknown;
}

export class Logger {
  private static format(level: string, message: string, ctx?: LogContext): string {
    const timestamp = new Date().toISOString();
    const correlationId = ctx?.correlationId || 'SYS-DEFAULT';
    const contextName = ctx?.context || 'General';

    const logObject = {
      timestamp,
      level,
      correlationId,
      context: contextName,
      message,
      ...ctx,
    };

    return JSON.stringify(logObject);
  }

  public static info(message: string, ctx?: LogContext): void {
    console.log(Logger.format('INFO', message, ctx));
  }

  public static warn(message: string, ctx?: LogContext): void {
    console.warn(Logger.format('WARN', message, ctx));
  }

  public static error(message: string, ctx?: LogContext): void {
    console.error(Logger.format('ERROR', message, ctx));
  }

  public static debug(message: string, ctx?: LogContext): void {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(Logger.format('DEBUG', message, ctx));
    }
  }
}
