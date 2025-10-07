/**
 * Structured Logger for Facebook API Integration
 * 
 * Provides consistent logging with context and security measures.
 * Never logs sensitive data like tokens or credentials.
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  adAccountId?: string;
  campaignId?: string;
  adSetId?: string;
  adId?: string;
  operation?: string;
  duration?: number;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    code?: number;
    stack?: string;
    fbtrace_id?: string;
  };
}

class Logger {
  private minLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.minLevel = this.getMinLogLevel();
  }

  private getMinLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase();
    switch (envLevel) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'info':
        return LogLevel.INFO;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      default:
        return this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  /**
   * Sanitize context to remove sensitive data
   */
  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    const sanitized = { ...context };
    
    // Remove sensitive fields
    const sensitiveKeys = [
      'accessToken',
      'access_token',
      'token',
      'password',
      'secret',
      'apiKey',
      'api_key',
      'appSecret',
      'app_secret',
    ];

    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        delete sanitized[key];
      }
    }

    // Mask partial sensitive data if present
    if (sanitized.email) {
      sanitized.email = this.maskEmail(sanitized.email);
    }

    return sanitized;
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***';
    const maskedLocal = local.length > 2 
      ? `${local[0]}***${local[local.length - 1]}`
      : '***';
    return `${maskedLocal}@${domain}`;
  }

  private formatLogEntry(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Human-readable format for development
      const parts = [
        `[${entry.timestamp}]`,
        `[${entry.level.toUpperCase()}]`,
        entry.message,
      ];

      if (entry.context) {
        parts.push(`\nContext: ${JSON.stringify(entry.context, null, 2)}`);
      }

      if (entry.error) {
        parts.push(`\nError: ${JSON.stringify(entry.error, null, 2)}`);
      }

      return parts.join(' ');
    } else {
      // JSON format for production (easier to parse by log aggregators)
      return JSON.stringify(entry);
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context),
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        code: (error as any).code,
        stack: this.isDevelopment ? error.stack : undefined,
        fbtrace_id: (error as any).fbtrace_id,
      };
    }

    const formatted = this.formatLogEntry(entry);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }
  }

  /**
   * Log debug message (verbose information for development)
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message (general information)
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message (potential issues)
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message (errors and exceptions)
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Create a child logger with default context
   */
  child(defaultContext: LogContext): Logger {
    const childLogger = new Logger();
    const originalLog = childLogger.log.bind(childLogger);
    
    childLogger.log = (level: LogLevel, message: string, context?: LogContext, error?: Error) => {
      const mergedContext = { ...defaultContext, ...context };
      originalLog(level, message, mergedContext, error);
    };

    return childLogger;
  }

  /**
   * Log API call with timing
   */
  logApiCall(
    operation: string,
    startTime: number,
    success: boolean,
    context?: LogContext
  ): void {
    const duration = Date.now() - startTime;
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = `Facebook API ${operation} ${success ? 'succeeded' : 'failed'}`;
    
    this.log(level, message, {
      ...context,
      operation,
      duration,
      success,
    });
  }

  /**
   * Log rate limit information
   */
  logRateLimit(
    usage: number,
    limit: number,
    context?: LogContext
  ): void {
    const percentage = (usage / limit) * 100;
    const level = percentage > 80 ? LogLevel.WARN : LogLevel.INFO;
    const message = `Rate limit usage: ${usage}/${limit} (${percentage.toFixed(1)}%)`;
    
    this.log(level, message, {
      ...context,
      rateLimitUsage: usage,
      rateLimitTotal: limit,
      rateLimitPercentage: percentage,
    });
  }

  /**
   * Log cache operation
   */
  logCache(
    operation: 'hit' | 'miss' | 'set' | 'invalidate',
    key: string,
    context?: LogContext
  ): void {
    const message = `Cache ${operation}: ${key}`;
    this.log(LogLevel.DEBUG, message, {
      ...context,
      cacheOperation: operation,
      cacheKey: key,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = (message: string, context?: LogContext) => 
  logger.debug(message, context);

export const logInfo = (message: string, context?: LogContext) => 
  logger.info(message, context);

export const logWarn = (message: string, context?: LogContext) => 
  logger.warn(message, context);

export const logError = (message: string, error?: Error, context?: LogContext) => 
  logger.error(message, error, context);
