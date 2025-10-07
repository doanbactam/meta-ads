// ============================================================================
// ERROR TYPES
// ============================================================================

export enum FacebookErrorType {
  AUTHENTICATION = "AUTHENTICATION",
  RATE_LIMIT = "RATE_LIMIT",
  PERMISSION = "PERMISSION",
  VALIDATION = "VALIDATION",
  TEMPORARY = "TEMPORARY",
  NETWORK = "NETWORK",
  UNKNOWN = "UNKNOWN",
}

// ============================================================================
// ERROR CODE MAPPING
// ============================================================================

/**
 * Maps Facebook API error codes to error types
 * Reference: https://developers.facebook.com/docs/graph-api/using-graph-api/error-handling
 */
export const ERROR_CODE_MAP: Record<number, FacebookErrorType> = {
  // Authentication errors
  190: FacebookErrorType.AUTHENTICATION, // Invalid OAuth 2.0 Access Token
  102: FacebookErrorType.AUTHENTICATION, // Session key invalid or no longer valid
  
  // Rate limit errors
  4: FacebookErrorType.RATE_LIMIT, // Application request limit reached
  17: FacebookErrorType.RATE_LIMIT, // User request limit reached
  32: FacebookErrorType.RATE_LIMIT, // Page request limit reached
  613: FacebookErrorType.RATE_LIMIT, // Calls to this api have exceeded the rate limit
  
  // Permission errors
  10: FacebookErrorType.PERMISSION, // Permission denied
  200: FacebookErrorType.PERMISSION, // Permissions error
  299: FacebookErrorType.PERMISSION, // User does not have permission
  
  // Validation errors
  100: FacebookErrorType.VALIDATION, // Invalid parameter
  
  // Temporary errors
  1: FacebookErrorType.TEMPORARY, // An unknown error occurred
  2: FacebookErrorType.TEMPORARY, // Service temporarily unavailable
  80001: FacebookErrorType.TEMPORARY, // There was an error performing this request
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

/**
 * FacebookAPIError - Custom error class cho Facebook API errors
 * 
 * Extends Error với additional properties specific cho Facebook API errors.
 * Provides methods để check retryability và get user-friendly messages.
 * 
 * @extends Error
 * 
 * @example
 * ```typescript
 * const error = new FacebookAPIError(
 *   190,
 *   FacebookErrorType.AUTHENTICATION,
 *   'Invalid OAuth 2.0 Access Token',
 *   'ABC123',
 *   { userId: 'user_123', endpoint: 'getCampaigns' }
 * );
 * 
 * if (error.isRetryable()) {
 *   const delay = error.getRetryDelay(0);
 *   await sleep(delay);
 *   // Retry operation
 * }
 * ```
 */
export class FacebookAPIError extends Error {
  public readonly code: number;
  public readonly type: FacebookErrorType;
  public readonly fbtrace_id?: string;
  public context?: FacebookErrorContext;
  public readonly timestamp: Date;

  /**
   * Create FacebookAPIError instance
   * 
   * @param {number} code - Facebook error code
   * @param {FacebookErrorType} type - Error type classification
   * @param {string} message - Error message
   * @param {string} [fbtrace_id] - Facebook trace ID cho debugging
   * @param {FacebookErrorContext} [context] - Additional context
   */
  constructor(
    code: number,
    type: FacebookErrorType,
    message: string,
    fbtrace_id?: string,
    context?: FacebookErrorContext
  ) {
    super(message);
    this.name = "FacebookAPIError";
    this.code = code;
    this.type = type;
    this.fbtrace_id = fbtrace_id;
    this.context = context;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FacebookAPIError);
    }
  }

  /**
   * Check nếu error có thể retry
   * 
   * Chỉ RATE_LIMIT, TEMPORARY, và NETWORK errors có thể retry.
   * AUTHENTICATION, PERMISSION, và VALIDATION errors không nên retry.
   * 
   * @returns {boolean} True nếu error có thể retry
   * 
   * @example
   * ```typescript
   * if (error.isRetryable()) {
   *   const delay = error.getRetryDelay(attempt);
   *   await sleep(delay);
   *   return retry();
   * }
   * ```
   */
  isRetryable(): boolean {
    return [
      FacebookErrorType.RATE_LIMIT,
      FacebookErrorType.TEMPORARY,
      FacebookErrorType.NETWORK,
    ].includes(this.type);
  }

  /**
   * Get retry delay dựa trên attempt number
   * 
   * Sử dụng exponential backoff với jitter cho RATE_LIMIT errors,
   * linear backoff cho TEMPORARY errors, và quick retry cho NETWORK errors.
   * 
   * @param {number} attempt - Retry attempt number (0-based)
   * @returns {number} Delay in milliseconds
   * 
   * Delay formulas:
   * - RATE_LIMIT: 2^attempt * 1000ms + jitter (max 60s)
   * - TEMPORARY: (attempt + 1) * 1000ms (max 10s)
   * - NETWORK: 500 * (attempt + 1)ms (max 5s)
   * 
   * @example
   * ```typescript
   * for (let attempt = 0; attempt < 3; attempt++) {
   *   try {
   *     return await operation();
   *   } catch (error) {
   *     if (error.isRetryable()) {
   *       const delay = error.getRetryDelay(attempt);
   *       await sleep(delay);
   *     } else {
   *       throw error;
   *     }
   *   }
   * }
   * ```
   */
  getRetryDelay(attempt: number): number {
    if (this.type === FacebookErrorType.RATE_LIMIT) {
      // Exponential backoff: 2^attempt * 1000ms + random jitter (0-500ms)
      const baseDelay = Math.pow(2, attempt) * 1000;
      const jitter = Math.random() * 500;
      return Math.min(baseDelay + jitter, 60000); // Max 60 seconds
    }

    if (this.type === FacebookErrorType.TEMPORARY) {
      // Linear backoff for temporary errors: (attempt + 1) * 1000ms
      return Math.min((attempt + 1) * 1000, 10000); // Max 10 seconds
    }

    if (this.type === FacebookErrorType.NETWORK) {
      // Quick retry for network errors
      return Math.min(500 * (attempt + 1), 5000); // Max 5 seconds
    }

    return 0;
  }

  /**
   * Get user-friendly error message
   * 
   * Convert technical error thành message dễ hiểu cho end users.
   * 
   * @returns {string} User-friendly error message
   * 
   * @example
   * ```typescript
   * try {
   *   await client.getCampaigns('act_123');
   * } catch (error) {
   *   if (error instanceof FacebookAPIError) {
   *     toast.error(error.getUserMessage());
   *   }
   * }
   * ```
   */
  getUserMessage(): string {
    switch (this.type) {
      case FacebookErrorType.AUTHENTICATION:
        return "Your Facebook session has expired. Please reconnect your account.";
      case FacebookErrorType.RATE_LIMIT:
        return "Too many requests. Please wait a moment and try again.";
      case FacebookErrorType.PERMISSION:
        return "You don't have permission to perform this action. Please check your Facebook permissions.";
      case FacebookErrorType.VALIDATION:
        return "Invalid data provided. Please check your input and try again.";
      case FacebookErrorType.TEMPORARY:
        return "Facebook is experiencing temporary issues. Please try again in a moment.";
      case FacebookErrorType.NETWORK:
        return "Unable to connect to Facebook. Please check your internet connection.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }

  /**
   * Convert error to JSON for logging
   */
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

/**
 * FacebookErrorHandler - Handles Facebook API errors với automatic retry logic
 * 
 * Provides centralized error handling và retry logic cho tất cả Facebook API calls.
 * Tự động parse errors, determine retryability, và implement exponential backoff.
 * 
 * @example
 * ```typescript
 * const handler = new FacebookErrorHandler();
 * 
 * const campaigns = await handler.handleWithRetry(
 *   () => client.getCampaigns('act_123'),
 *   {
 *     maxRetries: 3,
 *     onRetry: (error, attempt) => {
 *       console.log(`Retrying after ${error.type} error`);
 *     }
 *   }
 * );
 * ```
 */
export class FacebookErrorHandler {
  /**
   * Handle API operation với automatic retry logic
   * 
   * Wraps operation với error handling và retry logic. Tự động retry
   * retryable errors với appropriate delays.
   * 
   * @template T - Return type của operation
   * @param {() => Promise<T>} operation - Async operation to execute
   * @param {RetryOptions} [options] - Retry options
   * @param {number} [options.maxRetries=3] - Max retry attempts
   * @param {Function} [options.onRetry] - Callback gọi trước mỗi retry
   * @param {Function} [options.shouldRetry] - Custom retry logic
   * @returns {Promise<T>} Operation result
   * @throws {FacebookAPIError} Nếu operation fails sau all retries
   * 
   * @example
   * ```typescript
   * const handler = new FacebookErrorHandler();
   * 
   * try {
   *   const result = await handler.handleWithRetry(
   *     async () => {
   *       return await client.getCampaigns('act_123');
   *     },
   *     {
   *       maxRetries: 3,
   *       onRetry: (error, attempt) => {
   *         console.log(`Retry ${attempt + 1} after ${error.type}`);
   *       },
   *       shouldRetry: (error) => {
   *         // Custom logic: don't retry specific error codes
   *         return error.isRetryable() && error.code !== 613;
   *       }
   *     }
   *   );
   * } catch (error) {
   *   console.error('Operation failed:', error);
   * }
   * ```
   */
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

        // Check if we should retry
        const canRetry = shouldRetry ? shouldRetry(fbError) : fbError.isRetryable();

        if (!canRetry || attempt === maxRetries) {
          throw fbError;
        }

        // Calculate delay and wait
        const delay = fbError.getRetryDelay(attempt);
        
        // Call onRetry callback if provided
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

    // This should never be reached, but TypeScript needs it
    throw lastError || new Error("Unknown error occurred");
  }

  /**
   * Parse error từ various sources thành FacebookAPIError
   * 
   * Handles errors từ Facebook SDK, API responses, và network errors.
   * Tự động determine error type dựa trên error code.
   * 
   * @param {any} error - Raw error từ Facebook SDK hoặc API
   * @returns {FacebookAPIError} Parsed Facebook API error
   * 
   * @example
   * ```typescript
   * try {
   *   await fetch(url);
   * } catch (rawError) {
   *   const fbError = handler.parseFacebookError(rawError);
   *   console.log('Error type:', fbError.type);
   *   console.log('Error code:', fbError.code);
   * }
   * ```
   */
  parseFacebookError(error: any): FacebookAPIError {
    // If already a FacebookAPIError, return as is
    if (error instanceof FacebookAPIError) {
      return error;
    }

    // Parse error from Facebook SDK or API response
    let code = 0;
    let message = "Unknown error";
    let fbtrace_id: string | undefined;
    let context: FacebookErrorContext = { originalError: error };

    // Handle Facebook SDK error format
    if (error.response?.error) {
      const fbError = error.response.error;
      code = fbError.code || fbError.error_subcode || 0;
      message = fbError.message || fbError.error_user_msg || message;
      fbtrace_id = fbError.fbtrace_id;
    }
    // Handle direct error object
    else if (error.error) {
      code = error.error.code || error.error.error_subcode || 0;
      message = error.error.message || error.error.error_user_msg || message;
      fbtrace_id = error.error.fbtrace_id;
    }
    // Handle simple error format
    else if (error.code || error.message) {
      code = error.code || 0;
      message = error.message || message;
    }
    // Handle network errors
    else if (error.name === "TypeError" || error.name === "NetworkError") {
      return new FacebookAPIError(
        0,
        FacebookErrorType.NETWORK,
        error.message || "Network error occurred",
        undefined,
        context
      );
    }

    // Determine error type from code
    const type = ERROR_CODE_MAP[code] || FacebookErrorType.UNKNOWN;

    return new FacebookAPIError(code, type, message, fbtrace_id, context);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Log error with structured format
   */
  logError(error: FacebookAPIError, additionalContext?: Record<string, any>): void {
    const logData = {
      ...error.toJSON(),
      ...additionalContext,
    };

    // Use appropriate log level based on error type
    if (error.type === FacebookErrorType.TEMPORARY || error.type === FacebookErrorType.RATE_LIMIT) {
      console.warn("[FacebookAPIError]", logData);
    } else {
      console.error("[FacebookAPIError]", logData);
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create FacebookAPIError từ raw error
 * 
 * Helper function để quickly create FacebookAPIError với additional context.
 * Tự động parse error và merge context.
 * 
 * @param {any} error - Raw error từ Facebook SDK hoặc API
 * @param {FacebookErrorContext} [context] - Additional context to add
 * @param {string} [context.userId] - User ID
 * @param {string} [context.endpoint] - API endpoint
 * @param {Object} [context.params] - Request parameters
 * @returns {FacebookAPIError} Parsed Facebook API error
 * 
 * @example
 * ```typescript
 * try {
 *   await fetch(url);
 * } catch (rawError) {
 *   throw createFacebookError(rawError, {
 *     userId: 'user_123',
 *     endpoint: 'getCampaigns',
 *     params: { accountId: 'act_123' }
 *   });
 * }
 * ```
 */
export function createFacebookError(
  error: any,
  context?: FacebookErrorContext
): FacebookAPIError {
  const handler = new FacebookErrorHandler();
  const fbError = handler.parseFacebookError(error);
  
  // Merge context if provided
  if (context) {
    fbError.context = { ...fbError.context, ...context };
  }
  
  return fbError;
}

/**
 * Check nếu error là FacebookAPIError
 * 
 * Type guard function để safely check error type.
 * 
 * @param {any} error - Error to check
 * @returns {boolean} True nếu error là FacebookAPIError
 * 
 * @example
 * ```typescript
 * try {
 *   await client.getCampaigns('act_123');
 * } catch (error) {
 *   if (isFacebookError(error)) {
 *     console.log('Facebook error:', error.type, error.code);
 *     console.log('User message:', error.getUserMessage());
 *   } else {
 *     console.error('Unknown error:', error);
 *   }
 * }
 * ```
 */
export function isFacebookError(error: any): error is FacebookAPIError {
  return error instanceof FacebookAPIError;
}

/**
 * Wrap async function với error handling và retry logic
 * 
 * Higher-order function để automatically add error handling và retry
 * cho bất kỳ async function nào.
 * 
 * @template T - Function type
 * @param {T} fn - Async function to wrap
 * @param {RetryOptions} [options] - Retry options
 * @returns {T} Wrapped function với error handling
 * 
 * @example
 * ```typescript
 * // Original function
 * async function fetchCampaigns(accountId: string) {
 *   return await client.getCampaigns(accountId);
 * }
 * 
 * // Wrap với error handling
 * const safeFetchCampaigns = withFacebookErrorHandling(
 *   fetchCampaigns,
 *   { maxRetries: 3 }
 * );
 * 
 * // Use wrapped function - tự động retry on errors
 * const campaigns = await safeFetchCampaigns('act_123');
 * ```
 */
export function withFacebookErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: RetryOptions
): T {
  const handler = new FacebookErrorHandler();
  
  return (async (...args: Parameters<T>) => {
    return handler.handleWithRetry(() => fn(...args), options);
  }) as T;
}
