# Features Module

Feature-based organization cho business logic.

## 📁 Structure

```
features/
└── facebook/
    └── auth/
        ├── token-manager.ts    # Unified token management
        └── index.ts            # Exports
```

## 🎯 Philosophy

Mỗi feature là một module độc lập chứa:
- Components
- Actions (server actions)
- Hooks (React hooks)
- API logic
- Types
- Utils

## 📦 Current Features

### Facebook Authentication

**Location**: `features/facebook/auth/`

**Purpose**: Quản lý Facebook access tokens

**Exports**:
```typescript
import { tokenManager } from '@/features/facebook/auth';
```

**Capabilities**:
- ✅ Token encryption/decryption (AES-256-GCM)
- ✅ Secure storage in database
- ✅ Token validation with scope checking
- ✅ Automatic token refresh
- ✅ Revocation detection and handling

**Usage**:
```typescript
// Save token
await tokenManager.save(accountId, token, expiresAt);

// Get token
const token = await tokenManager.get(accountId);

// Refresh token
const result = await tokenManager.refresh(accountId);

// Handle revocation
await tokenManager.handleRevocation(accountId, reason);
```

## 🚀 Planned Features

### Campaigns
- Campaign management
- Campaign analytics
- Campaign optimization

### Ads
- Ad creation and editing
- Ad performance tracking
- Ad creative management

### Ad Sets
- Ad set configuration
- Budget management
- Targeting options

## 📚 Guidelines

### Creating a new feature

1. Create feature directory:
```
features/
└── my-feature/
    ├── components/
    ├── actions/
    ├── hooks/
    ├── api/
    ├── types/
    └── index.ts
```

2. Export from index.ts:
```typescript
export * from './components';
export * from './actions';
export * from './hooks';
```

3. Use in app:
```typescript
import { MyComponent, useMyHook } from '@/features/my-feature';
```

### Best Practices

- ✅ Keep features independent
- ✅ Use barrel exports (index.ts)
- ✅ Co-locate related code
- ✅ Write tests alongside code
- ✅ Document public APIs

### Anti-patterns

- ❌ Don't import from other features
- ❌ Don't put shared code in features
- ❌ Don't mix server and client code
- ❌ Don't skip documentation

## 🔗 Related

- [Token Manager Migration Guide](../../docs/TOKEN_MANAGER_MIGRATION.md)
- [Optimization Plan](../../docs/SRC_OPTIMIZATION_PLAN.md)
