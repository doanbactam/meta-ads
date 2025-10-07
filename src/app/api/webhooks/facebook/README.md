# Facebook Webhook Integration

## Overview

Endpoint này xử lý Facebook Marketing API webhooks để nhận real-time updates về campaigns, ad sets, ads, và insights thay vì phải polling liên tục.

## Setup Instructions

### 1. Configure Environment Variables

Thêm các biến sau vào file `.env`:

```bash
# Facebook App Secret (required for signature verification)
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Webhook Verify Token (random string bạn tự tạo)
# Generate với: node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
FACEBOOK_WEBHOOK_VERIFY_TOKEN=your_random_verify_token
```

### 2. Setup Webhook trong Facebook App Dashboard

1. Truy cập [Facebook Developers](https://developers.facebook.com/apps)
2. Chọn app của bạn
3. Vào **Webhooks** trong sidebar
4. Click **Add Subscription** cho **Page** hoặc **User**
5. Nhập Callback URL: `https://your-domain.com/api/webhooks/facebook`
6. Nhập Verify Token: giá trị giống với `FACEBOOK_WEBHOOK_VERIFY_TOKEN`
7. Chọn các subscription fields:
   - `ads_insights` - Nhận updates về insights data
   - Các fields khác tùy theo nhu cầu

### 3. Verify Webhook

Facebook sẽ gửi GET request để verify webhook endpoint:

```
GET /api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=CHALLENGE_STRING
```

Endpoint sẽ trả về `hub.challenge` nếu token đúng.

## Webhook Event Structure

Facebook gửi POST requests với structure sau:

```json
{
  "object": "page",
  "entry": [
    {
      "id": "page_id",
      "time": 1234567890,
      "changes": [
        {
          "field": "campaign",
          "value": {
            "id": "campaign_id",
            "status": "ACTIVE",
            ...
          }
        }
      ]
    }
  ]
}
```

## Supported Event Types

Endpoint hiện tại hỗ trợ các event types sau:

- **campaign** - Campaign status changes, budget updates
- **adset** - Ad Set status changes, targeting updates
- **ad** - Ad status changes, creative updates
- **insights** - Insights data updates

## Security Features

### 1. Signature Verification

Mọi webhook request đều được verify bằng HMAC SHA256 signature:

```typescript
X-Hub-Signature-256: sha256=<signature>
```

Endpoint sẽ reject requests với invalid signature.

### 2. Rate Limiting

- **Limit**: 100 requests per minute per IP
- **Response**: 429 Too Many Requests nếu vượt limit
- **Cleanup**: Tự động cleanup old entries mỗi 5 phút

## Event Processing

Webhook events được xử lý **asynchronously** để:
- Trả về 200 OK ngay lập tức (Facebook yêu cầu response < 20 seconds)
- Tránh timeout với large payloads
- Xử lý errors mà không ảnh hưởng đến webhook delivery

### Current Implementation

```typescript
// Acknowledge receipt immediately
return NextResponse.json({ success: true }, { status: 200 });

// Process events in background
processWebhookEvents(body).catch(error => {
  console.error('Error processing webhook events:', error);
});
```

### Event Handlers (TODO: Task 7.3)

Các handlers sau sẽ được implement trong task 7.3:

- `handleCampaignUpdate()` - Invalidate cache, update database
- `handleAdSetUpdate()` - Invalidate cache, update database
- `handleAdUpdate()` - Invalidate cache, update database
- `handleInsightsUpdate()` - Update cached metrics

## Testing

### Local Testing với ngrok

1. Install ngrok: `npm install -g ngrok`
2. Start local server: `bun run dev`
3. Expose local server: `ngrok http 3000`
4. Use ngrok URL trong Facebook webhook setup
5. Monitor logs: `tail -f logs/webhook.log`

### Manual Testing

Test GET verification:

```bash
curl "http://localhost:3000/api/webhooks/facebook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
```

Test POST event (với valid signature):

```bash
# Generate signature
PAYLOAD='{"object":"page","entry":[]}'
SECRET="your_app_secret"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

# Send request
curl -X POST http://localhost:3000/api/webhooks/facebook \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=$SIGNATURE" \
  -d "$PAYLOAD"
```

## Monitoring

### Logs

Webhook events được log với format:

```
Received webhook event: {
  object: 'page',
  entryCount: 1,
  timestamp: '2024-01-01T00:00:00.000Z'
}

Processing webhook change: {
  object: 'page',
  entryId: '123456',
  field: 'campaign',
  timestamp: '2024-01-01T00:00:00.000Z'
}
```

### Error Handling

- **Invalid signature**: Logged và rejected (403)
- **Rate limit exceeded**: Logged với IP address (429)
- **Processing errors**: Logged nhưng vẫn return 200 để tránh retry

## Troubleshooting

### Webhook không được verified

- Check `FACEBOOK_WEBHOOK_VERIFY_TOKEN` matches giữa .env và Facebook dashboard
- Check endpoint accessible từ internet (không localhost)
- Check logs cho error messages

### Webhook events không được nhận

- Verify webhook subscription active trong Facebook dashboard
- Check signature verification không fail
- Check rate limiting không block requests
- Monitor server logs

### Processing errors

- Check database connection
- Check cache manager initialization
- Review error logs cho stack traces
- Verify Facebook API credentials

## Next Steps

Task 7.2 sẽ implement `WebhookHandler` class với:
- Signature verification logic (extracted từ route)
- Event parsing và validation
- Async event processing với retry logic

Task 7.3 sẽ implement event handlers:
- Cache invalidation strategies
- Database update logic
- Sync operations với Facebook API
