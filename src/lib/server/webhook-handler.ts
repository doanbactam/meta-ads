/**
 * Facebook Webhook Handler
 * 
 * Handles Facebook webhook events with signature verification,
 * event parsing, validation, and async processing with queue support.
 * 
 * Requirements: 9.2, 9.6
 */

import crypto from 'crypto';
import { logger, type LogContext } from './logger';

/**
 * Webhook event structure from Facebook
 */
export interface WebhookEvent {
  object: 'page' | 'user' | 'permissions' | 'ads_insights' | string;
  entry: Array<{
    id: string;
    time: number;
    changes: Array<{
      field: string;
      value: any;
    }>;
  }>;
}

/**
 * Webhook change data
 */
export interface WebhookChange {
  entryId: string;
  timestamp: Date;
  field: string;
  value: any;
}

/**
 * Event handler function type
 */
export type EventHandler = (value: any, context: LogContext) => Promise<void>;

/**
 * Event queue item
 */
interface QueueItem {
  id: string;
  change: WebhookChange;
  handler: EventHandler;
  retryCount: number;
  addedAt: Date;
}

/**
 * Webhook handler configuration
 */
export interface WebhookHandlerConfig {
  appSecret: string;
  maxQueueSize?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  processingConcurrency?: number;
}

/**
 * WebhookHandler class
 * 
 * Handles Facebook webhook signature verification, event parsing,
 * validation, and async processing with retry logic.
 */
export class WebhookHandler {
  private appSecret: string;
  private maxQueueSize: number;
  private maxRetries: number;
  private retryDelayMs: number;
  private processingConcurrency: number;
  
  // Event handlers registry
  private handlers: Map<string, EventHandler> = new Map();
  
  // Event processing queue
  private queue: QueueItem[] = [];
  private processing = false;
  private activeProcessing = 0;

  constructor(config: WebhookHandlerConfig) {
    this.appSecret = config.appSecret;
    this.maxQueueSize = config.maxQueueSize || 1000;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelayMs = config.retryDelayMs || 1000;
    this.processingConcurrency = config.processingConcurrency || 5;

    logger.info('WebhookHandler initialized', {
      maxQueueSize: this.maxQueueSize,
      maxRetries: this.maxRetries,
      processingConcurrency: this.processingConcurrency,
    });
  }

  /**
   * Verify webhook signature from Facebook
   * 
   * @param payload - Raw request body as string
   * @param signature - X-Hub-Signature-256 header value
   * @returns true if signature is valid
   */
  verifySignature(payload: string, signature: string | null): boolean {
    const context: LogContext = {
      operation: 'verifySignature',
    };

    if (!signature) {
      logger.warn('Webhook signature missing', context);
      return false;
    }

    if (!this.appSecret) {
      logger.error('FACEBOOK_APP_SECRET not configured', undefined, context);
      return false;
    }

    try {
      // Remove 'sha256=' prefix if present
      const signatureHash = signature.startsWith('sha256=')
        ? signature.substring(7)
        : signature;

      // Calculate expected signature
      const expectedHash = crypto
        .createHmac('sha256', this.appSecret)
        .update(payload)
        .digest('hex');

      // Use timing-safe comparison to prevent timing attacks
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signatureHash, 'hex'),
        Buffer.from(expectedHash, 'hex')
      );

      if (!isValid) {
        logger.warn('Webhook signature verification failed', context);
      } else {
        logger.debug('Webhook signature verified successfully', context);
      }

      return isValid;
    } catch (error) {
      logger.error('Error verifying webhook signature', error as Error, context);
      return false;
    }
  }

  /**
   * Register an event handler for a specific field
   * 
   * @param field - Webhook field name (e.g., 'campaign', 'adset', 'ad', 'insights')
   * @param handler - Handler function to process the event
   */
  registerHandler(field: string, handler: EventHandler): void {
    this.handlers.set(field, handler);
    logger.debug(`Registered handler for field: ${field}`);
  }

  /**
   * Unregister an event handler
   * 
   * @param field - Webhook field name
   */
  unregisterHandler(field: string): void {
    this.handlers.delete(field);
    logger.debug(`Unregistered handler for field: ${field}`);
  }

  /**
   * Parse and validate webhook event
   * 
   * @param payload - Webhook payload (can be string or object)
   * @returns Parsed webhook event or null if invalid
   */
  parseEvent(payload: string | any): WebhookEvent | null {
    const context: LogContext = {
      operation: 'parseEvent',
    };

    try {
      // Parse if string
      const event: WebhookEvent = typeof payload === 'string'
        ? JSON.parse(payload)
        : payload;

      // Validate structure
      if (!event.object) {
        logger.warn('Webhook event missing "object" field', context);
        return null;
      }

      if (!event.entry || !Array.isArray(event.entry)) {
        logger.warn('Webhook event missing or invalid "entry" field', context);
        return null;
      }

      // Validate each entry
      for (const entry of event.entry) {
        if (!entry.id || !entry.time) {
          logger.warn('Webhook entry missing required fields', {
            ...context,
            entryId: entry.id,
          });
          return null;
        }

        if (!entry.changes || !Array.isArray(entry.changes)) {
          logger.warn('Webhook entry missing or invalid "changes" field', {
            ...context,
            entryId: entry.id,
          });
          return null;
        }

        // Validate each change
        for (const change of entry.changes) {
          if (!change.field || change.value === undefined) {
            logger.warn('Webhook change missing required fields', {
              ...context,
              entryId: entry.id,
              field: change.field,
            });
            return null;
          }
        }
      }

      logger.debug('Webhook event parsed and validated successfully', {
        ...context,
        object: event.object,
        entryCount: event.entry.length,
      });

      return event;
    } catch (error) {
      logger.error('Error parsing webhook event', error as Error, context);
      return null;
    }
  }

  /**
   * Process webhook event asynchronously
   * 
   * Adds events to queue for async processing with retry support.
   * Returns immediately after queuing.
   * 
   * @param event - Parsed webhook event
   */
  async processEvent(event: WebhookEvent): Promise<void> {
    const context: LogContext = {
      operation: 'processEvent',
      object: event.object,
    };

    logger.info('Processing webhook event', {
      ...context,
      entryCount: event.entry.length,
    });

    try {
      // Extract all changes from all entries
      const changes: WebhookChange[] = [];

      for (const entry of event.entry) {
        for (const change of entry.changes) {
          changes.push({
            entryId: entry.id,
            timestamp: new Date(entry.time * 1000),
            field: change.field,
            value: change.value,
          });
        }
      }

      // Queue each change for processing
      for (const change of changes) {
        await this.queueChange(change);
      }

      // Start processing queue if not already processing
      if (!this.processing) {
        this.startProcessing().catch(error => {
          logger.error('Error in queue processing', error as Error, context);
        });
      }
    } catch (error) {
      logger.error('Error processing webhook event', error as Error, context);
      throw error;
    }
  }

  /**
   * Queue a change for async processing
   * 
   * @param change - Webhook change to queue
   */
  private async queueChange(change: WebhookChange): Promise<void> {
    const context: LogContext = {
      operation: 'queueChange',
      field: change.field,
      entryId: change.entryId,
    };

    // Check if handler exists for this field
    const handler = this.handlers.get(change.field);
    if (!handler) {
      logger.debug(`No handler registered for field: ${change.field}`, context);
      return;
    }

    // Check queue size
    if (this.queue.length >= this.maxQueueSize) {
      logger.warn('Webhook queue is full, dropping event', {
        ...context,
        queueSize: this.queue.length,
        maxQueueSize: this.maxQueueSize,
      });
      return;
    }

    // Add to queue
    const queueItem: QueueItem = {
      id: `${change.entryId}-${change.field}-${Date.now()}`,
      change,
      handler,
      retryCount: 0,
      addedAt: new Date(),
    };

    this.queue.push(queueItem);

    logger.debug('Change queued for processing', {
      ...context,
      queueId: queueItem.id,
      queueSize: this.queue.length,
    });
  }

  /**
   * Start processing queued events
   */
  private async startProcessing(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;
    logger.debug('Started webhook queue processing');

    try {
      while (this.queue.length > 0) {
        // Wait if we've reached concurrency limit
        while (this.activeProcessing >= this.processingConcurrency) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Get next item from queue
        const item = this.queue.shift();
        if (!item) {
          break;
        }

        // Process item concurrently
        this.activeProcessing++;
        this.processQueueItem(item)
          .finally(() => {
            this.activeProcessing--;
          });
      }

      // Wait for all active processing to complete
      while (this.activeProcessing > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      this.processing = false;
      logger.debug('Stopped webhook queue processing');
    }
  }

  /**
   * Process a single queue item with retry logic
   * 
   * @param item - Queue item to process
   */
  private async processQueueItem(item: QueueItem): Promise<void> {
    const context: LogContext = {
      operation: 'processQueueItem',
      queueId: item.id,
      field: item.change.field,
      entryId: item.change.entryId,
      retryCount: item.retryCount,
    };

    try {
      logger.debug('Processing queue item', context);

      // Call the handler
      await item.handler(item.change.value, {
        entryId: item.change.entryId,
        field: item.change.field,
        timestamp: item.change.timestamp.toISOString(),
      });

      logger.info('Queue item processed successfully', context);
    } catch (error) {
      logger.error('Error processing queue item', error as Error, context);

      // Retry if not exceeded max retries
      if (item.retryCount < this.maxRetries) {
        item.retryCount++;
        
        // Calculate exponential backoff delay
        const delay = this.retryDelayMs * Math.pow(2, item.retryCount - 1);
        
        logger.info(`Retrying queue item after ${delay}ms`, {
          ...context,
          retryCount: item.retryCount,
          maxRetries: this.maxRetries,
          delayMs: delay,
        });

        // Wait and re-queue
        await new Promise(resolve => setTimeout(resolve, delay));
        this.queue.push(item);
      } else {
        logger.error('Queue item failed after max retries', error as Error, {
          ...context,
          maxRetries: this.maxRetries,
        });
      }
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): {
    queueSize: number;
    activeProcessing: number;
    isProcessing: boolean;
  } {
    return {
      queueSize: this.queue.length,
      activeProcessing: this.activeProcessing,
      isProcessing: this.processing,
    };
  }

  /**
   * Clear the queue (useful for testing or emergency situations)
   */
  clearQueue(): void {
    const clearedCount = this.queue.length;
    this.queue = [];
    logger.warn('Webhook queue cleared', {
      operation: 'clearQueue',
      clearedCount,
    });
  }
}

/**
 * Create a WebhookHandler instance with environment configuration
 */
export function createWebhookHandler(): WebhookHandler {
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  
  if (!appSecret) {
    throw new Error('FACEBOOK_APP_SECRET environment variable is required');
  }

  return new WebhookHandler({
    appSecret,
    maxQueueSize: parseInt(process.env.WEBHOOK_MAX_QUEUE_SIZE || '1000'),
    maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES || '3'),
    retryDelayMs: parseInt(process.env.WEBHOOK_RETRY_DELAY_MS || '1000'),
    processingConcurrency: parseInt(process.env.WEBHOOK_PROCESSING_CONCURRENCY || '5'),
  });
}
