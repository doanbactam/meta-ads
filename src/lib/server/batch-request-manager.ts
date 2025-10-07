import {
  FacebookSDKClient,
  BatchRequest,
  BatchResponse,
} from './facebook-sdk-client';
import { FacebookAPIError, FacebookErrorHandler } from './facebook-errors';

/**
 * Internal request với promise resolver
 */
interface QueuedRequest {
  request: BatchRequest;
  resolve: (response: BatchResponse) => void;
  reject: (error: Error) => void;
}

/**
 * BatchRequestManager
 * 
 * Quản lý batch requests để optimize API calls với Facebook Marketing API.
 * Facebook cho phép tối đa 50 requests trong một batch.
 * 
 * Features:
 * - Queue requests và execute theo batch
 * - Auto-batch execution khi đạt threshold
 * - Timer-based auto-execution
 * - Error handling và retry logic
 * 
 * @example
 * ```typescript
 * const batchManager = new BatchRequestManager(sdkClient);
 * batchManager.enableAutoBatch(10, 1000); // Auto-execute khi có 10 requests hoặc sau 1s
 * 
 * const response = await batchManager.addRequest({
 *   method: 'GET',
 *   relativeUrl: 'act_123/campaigns?fields=id,name'
 * });
 * ```
 */
export class BatchRequestManager {
  private queue: QueuedRequest[] = [];
  private readonly maxBatchSize = 50; // Facebook limit
  private autoBatchEnabled = false;
  private autoBatchThreshold = 10;
  private autoBatchTimer: NodeJS.Timeout | null = null;
  private autoBatchDelay = 100; // ms
  private isExecuting = false;
  private errorHandler: FacebookErrorHandler;

  constructor(private sdkClient: FacebookSDKClient) {
    this.errorHandler = new FacebookErrorHandler();
  }

  /**
   * Add request vào queue và return promise
   * 
   * Request sẽ được queued và executed khi:
   * - Queue đạt auto-batch threshold (nếu enabled)
   * - Auto-batch timer expires (nếu enabled)
   * - Queue đạt max size (50 requests)
   * - Manual executeBatch() được gọi
   * 
   * @param {BatchRequest} request - Batch request to add
   * @param {string} request.method - HTTP method ('GET', 'POST', 'DELETE', 'PUT')
   * @param {string} request.relativeUrl - Relative URL (e.g., 'act_123/campaigns')
   * @param {Object} [request.body] - Request body cho POST/PUT
   * @returns {Promise<BatchResponse>} Promise resolves khi request được executed
   * @throws {FacebookAPIError} Nếu request fails
   * 
   * @example
   * ```typescript
   * const batchManager = new BatchRequestManager(client);
   * 
   * const response = await batchManager.addRequest({
   *   method: 'GET',
   *   relativeUrl: 'act_123/campaigns?fields=id,name'
   * });
   * 
   * if (response.code === 200) {
   *   const data = JSON.parse(response.body);
   *   console.log('Campaigns:', data);
   * }
   * ```
   */
  async addRequest(request: BatchRequest): Promise<BatchResponse> {
    return new Promise<BatchResponse>((resolve, reject) => {
      // Add vào queue
      this.queue.push({
        request,
        resolve,
        reject,
      });

      // Check auto-batch conditions
      if (this.autoBatchEnabled) {
        // Nếu đạt threshold, execute ngay
        if (this.queue.length >= this.autoBatchThreshold) {
          this.clearAutoBatchTimer();
          void this.executeBatch();
        } else {
          // Reset timer để execute sau delay
          this.resetAutoBatchTimer();
        }
      }

      // Nếu đạt max size, force execute
      if (this.queue.length >= this.maxBatchSize) {
        this.clearAutoBatchTimer();
        void this.executeBatch();
      }
    });
  }

  /**
   * Execute tất cả requests trong queue
   * 
   * Tự động split thành multiple batches nếu có > 50 requests (Facebook limit).
   * Prevents concurrent execution để avoid race conditions.
   * 
   * @returns {Promise<BatchResponse[]>} Array of all responses
   * @throws {FacebookAPIError} Nếu batch execution fails
   * 
   * @example
   * ```typescript
   * // Add multiple requests
   * batchManager.addRequest({ method: 'GET', relativeUrl: 'act_123/campaigns' });
   * batchManager.addRequest({ method: 'GET', relativeUrl: 'act_123/adsets' });
   * 
   * // Execute all at once
   * const responses = await batchManager.executeBatch();
   * console.log('Executed', responses.length, 'requests');
   * ```
   */
  async executeBatch(): Promise<BatchResponse[]> {
    // Prevent concurrent execution
    if (this.isExecuting) {
      return [];
    }

    // Clear auto-batch timer
    this.clearAutoBatchTimer();

    // Get current queue và clear
    const requestsToProcess = [...this.queue];
    this.queue = [];

    if (requestsToProcess.length === 0) {
      return [];
    }

    this.isExecuting = true;

    try {
      // Split thành batches of 50
      const batches: QueuedRequest[][] = [];
      for (let i = 0; i < requestsToProcess.length; i += this.maxBatchSize) {
        batches.push(requestsToProcess.slice(i, i + this.maxBatchSize));
      }

      // Execute từng batch
      const allResponses: BatchResponse[] = [];
      for (const batch of batches) {
        const responses = await this.executeSingleBatch(batch);
        allResponses.push(...responses);
      }

      return allResponses;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Execute một batch (max 50 requests)
   */
  private async executeSingleBatch(
    batch: QueuedRequest[]
  ): Promise<BatchResponse[]> {
    try {
      // Prepare batch request
      const batchRequests = batch.map((item) => item.request);

      // Execute batch qua SDK client
      const responses = await this.errorHandler.handleWithRetry(
        () => this.sdkClient.batchRequest(batchRequests),
        { maxRetries: 3 }
      );

      // Distribute responses về individual callers
      batch.forEach((item, index) => {
        const response = responses[index];
        if (response) {
          // Check response code
          if (response.code >= 200 && response.code < 300) {
            item.resolve(response);
          } else {
            // Parse error từ response body
            const error = this.parseErrorFromResponse(response);
            item.reject(error);
          }
        } else {
          item.reject(new Error('No response received for request'));
        }
      });

      return responses;
    } catch (error) {
      // Nếu batch fails, reject tất cả requests
      const fbError = this.errorHandler.parseFacebookError(error);

      batch.forEach((item) => {
        item.reject(fbError);
      });

      throw error;
    }
  }

  /**
   * Parse error từ batch response
   */
  private parseErrorFromResponse(response: BatchResponse): FacebookAPIError {
    try {
      const body = JSON.parse(response.body);
      const error = body.error || {};

      // Use errorHandler to parse error properly
      return this.errorHandler.parseFacebookError({
        error: {
          code: error.code || response.code,
          message: error.message || `Request failed with status ${response.code}`,
          fbtrace_id: error.fbtrace_id,
        },
      });
    } catch {
      return this.errorHandler.parseFacebookError({
        error: {
          code: response.code,
          message: `Request failed with status ${response.code}`,
        },
      });
    }
  }

  /**
   * Enable auto-batch execution
   * 
   * Khi enabled, batch sẽ tự động execute khi:
   * - Queue đạt threshold number of requests
   * - Delay timer expires (nếu có requests trong queue)
   * 
   * @param {number} [threshold=10] - Số requests để trigger auto-execute (max 50)
   * @param {number} [delay=100] - Delay trước khi auto-execute (milliseconds)
   * 
   * @example
   * ```typescript
   * const batchManager = new BatchRequestManager(client);
   * 
   * // Auto-execute khi có 10 requests hoặc sau 1 second
   * batchManager.enableAutoBatch(10, 1000);
   * 
   * // Add requests - sẽ tự động execute
   * for (let i = 0; i < 15; i++) {
   *   batchManager.addRequest({
   *     method: 'GET',
   *     relativeUrl: `campaign_${i}?fields=id,name`
   *   });
   * }
   * // First 10 requests execute immediately
   * // Remaining 5 execute after 1 second
   * ```
   */
  enableAutoBatch(threshold = 10, delay = 100): void {
    this.autoBatchEnabled = true;
    this.autoBatchThreshold = Math.min(threshold, this.maxBatchSize);
    this.autoBatchDelay = delay;
  }

  /**
   * Disable auto-batch execution
   */
  disableAutoBatch(): void {
    this.autoBatchEnabled = false;
    this.clearAutoBatchTimer();
  }

  /**
   * Reset auto-batch timer
   */
  private resetAutoBatchTimer(): void {
    this.clearAutoBatchTimer();
    this.autoBatchTimer = setTimeout(() => {
      void this.executeBatch();
    }, this.autoBatchDelay);
  }

  /**
   * Clear auto-batch timer
   */
  private clearAutoBatchTimer(): void {
    if (this.autoBatchTimer) {
      clearTimeout(this.autoBatchTimer);
      this.autoBatchTimer = null;
    }
  }

  /**
   * Clear queue và reject tất cả pending requests
   * 
   * Useful khi cần cancel tất cả pending requests (e.g., user logout).
   * 
   * @example
   * ```typescript
   * // Cancel all pending requests
   * batchManager.clearQueue();
   * ```
   */
  clearQueue(): void {
    this.clearAutoBatchTimer();

    const error = new Error('Queue cleared');
    this.queue.forEach((item) => {
      item.reject(error);
    });

    this.queue = [];
  }

  /**
   * Get current queue size
   * 
   * @returns {number} Number of requests trong queue
   * 
   * @example
   * ```typescript
   * console.log('Pending requests:', batchManager.getQueueSize());
   * ```
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Check if auto-batch is enabled
   */
  isAutoBatchEnabled(): boolean {
    return this.autoBatchEnabled;
  }

  /**
   * Get auto-batch configuration
   * 
   * @returns {Object} Auto-batch config
   * @returns {boolean} config.enabled - Whether auto-batch is enabled
   * @returns {number} config.threshold - Threshold để trigger execution
   * @returns {number} config.delay - Delay trước khi execute (ms)
   * 
   * @example
   * ```typescript
   * const config = batchManager.getAutoBatchConfig();
   * console.log('Auto-batch:', config.enabled ? 'enabled' : 'disabled');
   * console.log('Threshold:', config.threshold);
   * ```
   */
  getAutoBatchConfig(): {
    enabled: boolean;
    threshold: number;
    delay: number;
  } {
    return {
      enabled: this.autoBatchEnabled,
      threshold: this.autoBatchThreshold,
      delay: this.autoBatchDelay,
    };
  }
}
