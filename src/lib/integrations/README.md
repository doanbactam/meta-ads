# External Integrations

Centralized external API integrations.

## 📁 Structure

```
integrations/
└── facebook/
    ├── config.ts          # Configuration & environment validation
    ├── errors.ts          # Error handling & retry logic
    ├── api-client.ts      # High-level API client
    └── index.ts           # Barrel exports
```

## 🎯 Philosophy

Mỗi integration là một module độc lập với:
- Configuration management
- Error handling
- API client
- Type definitions
- Utilities

## 📦 Current Integrations

### Facebook Marketing API

**Location**: `lib/integrations/facebook/`

**Purpose**: Integration với Facebook Marketing API v23.0

**Exports**:
```typescript
import {
  FACEBOOK_API_CONFIG,
  FACEBOOK_FIELDS,
  FacebookMarketingAPI,
  FacebookErrorHandler,
  FacebookAPIError,
  createFacebookError,
} from '@/lib/integrations/facebook';
```

**Features**:
- ✅ Environment validation với Zod
- ✅ Comprehensive error handling
- ✅ Automatic retry với exponential backoff
- ✅ Rate limit handling
- ✅ Type-safe API client
- ✅ User-friendly error messages

**Usage**:
```typescript
// Initialize client
const client = new FacebookMarketingAPI(accessToken);

// Validate token
const validation = await client.validateToken();

// Error handling
const handler = new FacebookErrorHandler();
const result = await handler.handleWithRetry(
  () => client.getCampaigns('act_123'),
  { maxRetries: 3 }
);
```

## 🚀 Planned Integrations

### Clerk (Authentication)
- User management
- Session handling
- Webhook processing

### AI Providers
- OpenAI integration
- Anthropic integration
- AI analysis utilities

## 📚 Guidelines

### Creating a new integration

1. Create integration directory:
```
integrations/
└── my-service/
    ├── config.ts          # Configuration
    ├── errors.ts          # Error handling
    ├── client.ts          # API client
    ├── types.ts           # Type definitions
    └── index.ts           # Exports
```

2. Export from index.ts:
```typescript
export * from './config';
export * from './errors';
export * from './client';
export * from './types';
```

3. Use in app:
```typescript
import { MyServiceClient } from '@/lib/integrations/my-service';
```

### Best Practices

- ✅ Validate environment variables
- ✅ Implement comprehensive error handling
- ✅ Add retry logic for transient errors
- ✅ Provide type-safe interfaces
- ✅ Document public APIs
- ✅ Handle rate limits gracefully

### Anti-patterns

- ❌ Don't hardcode credentials
- ❌ Don't ignore errors
- ❌ Don't skip validation
- ❌ Don't mix integrations
- ❌ Don't skip documentation

## 🔗 Related

- [Facebook Integration](./facebook/)
- [Features Module](../../features/README.md)
- [Optimization Plan](../../../docs/SRC_OPTIMIZATION_PLAN.md)
