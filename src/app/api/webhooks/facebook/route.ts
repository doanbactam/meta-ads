import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Simple in-memory rate limiter for webhook endpoint
 * Tracks requests per IP address
 */
class WebhookRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the time window
    const recentRequests = requests.filter(time => now - time < this.windowMs);
    
    if (recentRequests.length >= this.maxRequests) {
      return true;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return false;
  }

  cleanup() {
    const now = Date.now();
    const entries = Array.from(this.requests.entries());
    for (const [identifier, requests] of entries) {
      const recentRequests = requests.filter((time: number) => now - time < this.windowMs);
      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }
}

// Initialize rate limiter (100 requests per minute)
const rateLimiter = new WebhookRateLimiter(100, 60000);

// Cleanup old entries every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

/**
 * Verify webhook signature from Facebook
 * @param payload - Raw request body
 * @param signature - X-Hub-Signature-256 header value
 * @returns true if signature is valid
 */
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  if (!signature) {
    return false;
  }

  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appSecret) {
    console.error('FACEBOOK_APP_SECRET not configured');
    return false;
  }

  // Remove 'sha256=' prefix if present
  const signatureHash = signature.startsWith('sha256=') 
    ? signature.substring(7) 
    : signature;

  // Calculate expected signature
  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');

  // Use timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signatureHash, 'hex'),
    Buffer.from(expectedHash, 'hex')
  );
}

/**
 * GET handler for webhook verification
 * Facebook sends a GET request to verify the webhook endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Check if this is a webhook verification request
    if (mode === 'subscribe') {
      const verifyToken = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN;
      
      if (!verifyToken) {
        console.error('FACEBOOK_WEBHOOK_VERIFY_TOKEN not configured');
        return NextResponse.json(
          { error: 'Webhook verify token not configured' },
          { status: 500 }
        );
      }

      // Verify the token matches
      if (token === verifyToken) {
        console.log('Webhook verified successfully');
        // Respond with the challenge to complete verification
        return new NextResponse(challenge, { status: 200 });
      } else {
        console.error('Webhook verification failed: token mismatch');
        return NextResponse.json(
          { error: 'Verification token mismatch' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid verification request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Webhook verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for webhook events
 * Facebook sends POST requests with event data
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const identifier = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (rateLimiter.isRateLimited(identifier)) {
      console.warn(`Rate limit exceeded for ${identifier}`);
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    // Parse the webhook payload
    const body = JSON.parse(rawBody);

    // Log the webhook event
    console.log('Received webhook event:', {
      object: body.object,
      entryCount: body.entry?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Process webhook events asynchronously
    // Note: We return 200 immediately to acknowledge receipt
    // Actual processing happens in the background
    if (body.entry && Array.isArray(body.entry)) {
      // Process each entry asynchronously (don't await)
      processWebhookEvents(body).catch(error => {
        console.error('Error processing webhook events:', error);
      });
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Still return 200 to prevent Facebook from retrying
    // Log the error for investigation
    return NextResponse.json(
      { success: false, error: 'Processing error' },
      { status: 200 }
    );
  }
}

/**
 * Process webhook events asynchronously
 * This function handles the actual event processing
 */
async function processWebhookEvents(payload: any): Promise<void> {
  try {
    const { object, entry } = payload;

    for (const entryItem of entry) {
      const { id, time, changes } = entryItem;

      if (!changes || !Array.isArray(changes)) {
        continue;
      }

      for (const change of changes) {
        const { field, value } = change;

        console.log('Processing webhook change:', {
          object,
          entryId: id,
          field,
          timestamp: new Date(time * 1000).toISOString()
        });

        // Route to appropriate handler based on field
        switch (field) {
          case 'campaign':
            await handleCampaignUpdate(value);
            break;
          case 'adset':
            await handleAdSetUpdate(value);
            break;
          case 'ad':
            await handleAdUpdate(value);
            break;
          case 'insights':
            await handleInsightsUpdate(value);
            break;
          default:
            console.log(`Unhandled webhook field: ${field}`);
        }
      }
    }
  } catch (error) {
    console.error('Error in processWebhookEvents:', error);
    throw error;
  }
}

/**
 * Handle campaign update webhook
 */
async function handleCampaignUpdate(value: any): Promise<void> {
  console.log('Campaign update:', value);
  // TODO: Implement in task 7.3
  // - Invalidate campaign cache
  // - Update database if needed
  // - Trigger any necessary sync operations
}

/**
 * Handle ad set update webhook
 */
async function handleAdSetUpdate(value: any): Promise<void> {
  console.log('AdSet update:', value);
  // TODO: Implement in task 7.3
  // - Invalidate ad set cache
  // - Update database if needed
}

/**
 * Handle ad update webhook
 */
async function handleAdUpdate(value: any): Promise<void> {
  console.log('Ad update:', value);
  // TODO: Implement in task 7.3
  // - Invalidate ad cache
  // - Update database if needed
}

/**
 * Handle insights update webhook
 */
async function handleInsightsUpdate(value: any): Promise<void> {
  console.log('Insights update:', value);
  // TODO: Implement in task 7.3
  // - Invalidate insights cache
  // - Update cached metrics
}
