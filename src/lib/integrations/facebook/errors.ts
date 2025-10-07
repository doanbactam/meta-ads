/**
 * Facebook API Error Handling
 * 
 * Comprehensive error handling for Facebook Marketing API.
 * Includes error classification, retry logic, and user-friendly messages.
 * 
 * @module lib/integrations/facebook
 */

// ============================================================================
// ERROR TYPES
// ============================================================================

export enum FacebookErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  RATE_LIMIT = 'RATE_LIMIT',
  PERMISSION = 'PERMISSION',
  VALIDATION = 'VALIDATION',
  TEMPORARY = 'TEMPORARY',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN',
}

// ============================================================================
// ERROR CODE MAPPING
// ============================================================================

export const ERROR_CODE_MAP: Record<number, FacebookErrorType> = {
  // Authentication errors
  190: FacebookErrorType.AUTHENTICATION,
  102: FacebookErrorType.AUTHENTICATION,
  
  // Rate limit errors
  4: FacebookErrorType.RATE_LIMIT,
  17: FacebookErrorType.RATE_LIMIT,
  32: FacebookErrorType.RATE_LIMIT,
  613: FacebookErrorType.RATE_LIMIT,
  
  // Permission errors
  10: FacebookErrorType.PERMISSION,
  200: FacebookErrorType.PERMISSION,
  299: FacebookErrorType.PERMISSION,
  
  // Validation errors
  100: FacebookErrorType.VALIDATION,
  
  // Temporary errors
  1: FacebookErrorType.TEMPORARY,
  2: FacebookErrorType.TEMPORARY,
  80001: FacebookErrorType.TEMPORARY,
};

// ============================================================================
// FACEBOOK API ERROR CLASS
// ============================================================================

export interface FacebookErrorContext {
  originalError?: any;
  requestId?: string;
  userId?: string;
  endpoint?: string;
  params?: Record<string, any>;
}

export class FacebookAPIError extends Error {
  public readonly code: number;
  public readonly type: FacebookErrorType;
  public readonly fbtrace_id?: string;
  public context?: FacebookErrorContext;
  public readonly timestamp: Date;

  constructor(
    code: number,
    type: FacebookErrorType,
    message: string,
    fbtrace_id?: string,
    context?: FacebookErrorContext
  ) {
    super(message);
    this.name = 'FacebookAPIError';
    this.code = code;
    this.type = type;
    this.fbtrace_id = fbtrace_id;
    this.context = context;
    this.timestamp = new Date();

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FacebookAPIError);
    }
  }

  isRetryable(): boolean {
    return [
      FacebookErrorType.RATE_LIMIT,
      FacebookErrorType.TEMPORARY,
      FacebookErrorType.NETWORK,
    ].includes(this.type);
  }

  getRetryDelay(attempt: number): number {
    if (this.type === FacebookErrorType.RATE_LIMIT) {
      const baseDelay = Math.pow(2, attempt) * 1000;
      const jitter = Math.random() * 500;
      return Math.min(baseDelay + jitter, 60000);
    }

    if (this.type === FacebookErrorType.TEMPORARY) {
      return Math.min((attempt + 1) * 1000, 10000);
    }

    if (this.type === FacebookErrorType.NETWORK) {
      return Math.min(500 * (attempt + 1), 5000);
    }

    return 0;
  }

  getUserMessage(): string {
    switch (this.type) {
      case FacebookErrorType.AUTHENTICATION:
        return 'Your Facebook session has expired. Please reconnect your account.';
      case FacebookErrorType.RATE_LIMIT:
        return 'Too many requests. Please wait a moment and try again.';
      case FacebookErrorType.PERMISSION:
        return "You don't have permission to perform this action.";
      case FacebookErrorType.VALIDATION:
        return 'Invalid data provided. Please check your input.';
      case FacebookErrorType.TEMPORARY:
        return 'Facebook is experiencing temporary issues. Please try again.';
      case FacebookErrorType.NETWORK:
        return 'Unable to connect to Facebook. Please check your connection.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      type: this.type,
      message: this.message,
      fbtrace_id: this.fbtrace_id,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

// ============================================================================
// FACEBOOK ERROR HANDLER
// ============================================================================

export interface RetryOptions {
  maxRetries?: number;
  onRetry?: (error: FacebookAPIError, attempt: number) => void;
  shouldRetry?: (error: FacebookAPIError) => boolean;
}

export class FacebookErrorHandler {
  async handleWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const { maxRetries = 3, onRetry, shouldRetry } = options;
    let lastError: FacebookAPIError | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const fbError = this.parseFacebookError(error);
        lastError = fbError;

        const canRetry = shouldRetry ? shouldRetry(fbError) : fbError.isRetryable();

        if (!canRetry || attempt === maxRetries) {
          throw fbError;
        }

        const delay = fbError.getRetryDelay(attempt);
        
        if (onRetry) {
          onRetry(fbError, attempt);
        }

        console.log(
          `[FacebookErrorHandler] Retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
          {
            errorType: fbError.type,
            errorCode: fbError.code,
            fbtrace_id: fbError.fbtrace_id,
          }
        );

        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Unknown error occurred');
  }

  parseFacebookError(error: any): FacebookAPIError {
    if (error instanceof FacebookAPIError) {
      return error;
    }

    let code = 0;
    let message = 'Unknown error';
    let fbtrace_id: string | undefined;
    const context: FacebookErrorContext = { originalError: error };

    // Handle Facebook SDK error format
    if (error.response?.error) {
      const fbError = error.response.error;
      code = fbError.code || fbError.error_subcode || 0;
      message = fbError.message || fbError.error_user_msg || message;
      fbtrace_id = fbError.fbtrace_id;
    }
    else if (error.error) {
      code = error.error.code || error.error.error_subcode || 0;
      message = error.error.message || error.error.error_user_msg || message;
      fbtrace_id = error.error.fbtrace_id;
    }
    else if (error.code || error.message) {
      code = error.code || 0;
      message = error.message || message;
    }
    else if (error.name === 'TypeError' || error.name === 'NetworkError') {
      return new FacebookAPIError(
        0,
        FacebookErrorType.NETWORK,
        error.message || 'Network error occurred',
        undefined,
        context
      );
    }

    const type = ERROR_CODE_MAP[code] || FacebookErrorType.UNKNOWN;

    return new FacebookAPIError(code, type, message, fbtrace_id, context);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  logError(error: FacebookAPIError, additionalContext?: Record<string, any>): void {
    const logData = {
      ...error.toJSON(),
      ...additionalContext,
    };

    if (error.type === FacebookErrorType.TEMPORARY || error.type === FacebookErrorType.RATE_LIMIT) {
      console.warn('[FacebookAPIError]', logData);
    } else {
      console.error('[FacebookAPIError]', logData);
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function createFacebookError(
  error: any,
  context?: FacebookErrorContext
): FacebookAPIError {
  const handler = new FacebookErrorHandler();
  const fbError = handler.parseFacebookError(error);
  
  if (context) {
    fbError.context = { ...fbError.context, ...context };
  }
  
  return fbError;
}

export function isFacebookError(error: any): error is FacebookAPIError {
  return error instanceof FacebookAPIError;
}

export function withFacebookErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: RetryOptions
): T {
  const handler = new FacebookErrorHandler();
  
  return (async (...args: Parameters<T>) => {
    return handler.handleWithRetry(() => fn(...args), options);
  }) as T;
}
