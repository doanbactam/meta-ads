# PLAN: Tích Hợp AI SDK (X AI/Grok) vào Ad Manager Dashboard

## 📋 Tổng Quan

**Mục tiêu**: Tích hợp Vercel AI SDK với X AI (Grok) để cung cấp khả năng phân tích thông minh và đề xuất tối ưu hóa quảng cáo Facebook tự động.

**Phiên bản AI SDK**: Vercel AI SDK 4.x (latest)  
**AI Provider**: X AI (Grok) - Grok-2-latest hoặc Grok-2-vision-latest  
**Thời gian ước tính**: 5-7 ngày làm việc  
**Độ ưu tiên**: HIGH

---

## 🎯 Mục Tiêu Chi Tiết

### 1. **Phân Tích Hiệu Suất Quảng Cáo (Ad Performance Analysis)**
- Phân tích metrics: CTR, CPC, ROAS, Conversion Rate
- So sánh hiệu suất giữa các campaigns/ad sets/ads
- Xác định trends và patterns trong dữ liệu
- Dự đoán hiệu suất trong tương lai

### 2. **Đề Xuất Tối Ưu Hóa (Optimization Recommendations)**
- Budget reallocation suggestions
- Targeting optimization
- Creative performance insights
- Bid strategy recommendations
- Schedule optimization

### 3. **Phân Tích Đối Thủ & Thị Trường (Competitive Analysis)**
- Benchmark so với industry standards
- Trend analysis trong vertical
- Seasonal patterns detection

### 4. **Tự Động Hóa & Alerts (Automation & Alerts)**
- Real-time anomaly detection
- Performance degradation alerts
- Automated optimization suggestions
- Proactive recommendations

### 5. **Natural Language Query (Chat Interface)**
- Hỏi đáp về dữ liệu quảng cáo bằng ngôn ngữ tự nhiên
- Generate reports tự động
- Export insights to different formats

---

## 🏗️ Kiến Trúc Kỹ Thuật

### Tech Stack Mới Cần Thêm

```json
{
  "dependencies": {
    "ai": "^4.0.0",                          // Vercel AI SDK
    "@ai-sdk/openai": "^1.0.0",             // OpenAI provider (fallback)
    "openai": "^4.67.0",                    // OpenAI SDK
    "zod": "^3.24.1",                       // Already installed - for structured output
    "zod-to-json-schema": "^3.23.0"         // Convert Zod to JSON Schema
  }
}
```

### Cấu Trúc Thư Mục Mới

```
src/
├── lib/
│   ├── ai/                                # New AI module
│   │   ├── providers/
│   │   │   ├── xai-provider.ts           # X AI (Grok) configuration
│   │   │   └── openai-provider.ts        # OpenAI fallback
│   │   ├── prompts/
│   │   │   ├── analysis-prompts.ts       # Ad analysis prompts
│   │   │   ├── optimization-prompts.ts   # Optimization prompts
│   │   │   └── system-prompts.ts         # System prompts
│   │   ├── schemas/
│   │   │   ├── analysis-schemas.ts       # Zod schemas for AI responses
│   │   │   └── recommendation-schemas.ts # Optimization schemas
│   │   ├── services/
│   │   │   ├── ad-analyzer.ts            # Ad performance analysis
│   │   │   ├── optimizer.ts              # Optimization engine
│   │   │   ├── anomaly-detector.ts       # Anomaly detection
│   │   │   └── chat-service.ts           # Natural language interface
│   │   ├── utils/
│   │   │   ├── data-formatter.ts         # Format data for AI
│   │   │   ├── context-builder.ts        # Build context for prompts
│   │   │   └── response-parser.ts        # Parse AI responses
│   │   └── index.ts                      # Main exports
│   └── server/
│       └── api/
│           └── ai-insights.ts            # AI-powered insights API
├── app/
│   └── api/
│       └── ai/
│           ├── analyze/
│           │   └── route.ts              # Analysis endpoint
│           ├── optimize/
│           │   └── route.ts              # Optimization endpoint
│           ├── chat/
│           │   └── route.ts              # Chat endpoint (streaming)
│           └── insights/
│               └── route.ts              # Get insights for entity
├── components/
│   ├── ai/
│   │   ├── ai-insights-panel.tsx         # Main insights component
│   │   ├── ai-chat-dialog.tsx            # Chat interface
│   │   ├── optimization-card.tsx         # Optimization suggestions
│   │   ├── performance-analysis.tsx      # Performance analysis view
│   │   ├── anomaly-alerts.tsx            # Anomaly detection alerts
│   │   └── ai-loading-state.tsx          # AI processing states
│   └── dashboard/
│       └── ai-assistant-widget.tsx       # Dashboard AI widget
├── actions/
│   └── ai.ts                             # AI-related server actions
├── hooks/
│   ├── use-ai-analysis.ts                # Hook for AI analysis
│   ├── use-ai-chat.ts                    # Hook for chat interface
│   └── use-ai-insights.ts                # Hook for insights
└── types/
    └── ai.ts                             # AI-related TypeScript types
```

---

## 📊 Database Schema Changes

### New Tables

```prisma
// Add to schema.prisma

model AIInsight {
  id                String           @id @default(cuid())
  userId            String           @map("user_id")
  adAccountId       String?          @map("ad_account_id")
  entityType        AIEntityType     @map("entity_type")  // CAMPAIGN, AD_SET, AD, ACCOUNT
  entityId          String?          @map("entity_id")
  insightType       AIInsightType    @map("insight_type") // ANALYSIS, OPTIMIZATION, ANOMALY, PREDICTION
  title             String
  description       String           @db.Text
  priority          AIPriority       // LOW, MEDIUM, HIGH, CRITICAL
  confidence        Float            // 0.0 - 1.0
  category          String           // performance, budget, targeting, creative, etc.
  
  // Structured data
  metrics           Json?            // Related metrics
  recommendations   Json?            // Actionable recommendations
  expectedImpact    Json?            // Expected impact if applied
  
  // Status tracking
  status            AIInsightStatus  @default(ACTIVE) // ACTIVE, DISMISSED, APPLIED, EXPIRED
  appliedAt         DateTime?        @map("applied_at")
  dismissedAt       DateTime?        @map("dismissed_at")
  expiresAt         DateTime?        @map("expires_at")
  
  createdAt         DateTime         @default(now()) @map("created_at")
  updatedAt         DateTime         @updatedAt @map("updated_at")

  @@index([userId])
  @@index([adAccountId])
  @@index([entityType, entityId])
  @@index([status])
  @@index([createdAt])
  @@map("ai_insights")
}

model AIAnalysisHistory {
  id                String           @id @default(cuid())
  userId            String           @map("user_id")
  adAccountId       String           @map("ad_account_id")
  entityType        AIEntityType     @map("entity_type")
  entityId          String           @map("entity_id")
  analysisType      String           @map("analysis_type") // full_analysis, quick_scan, comparison
  
  // Analysis data
  inputData         Json             @map("input_data")    // Data sent to AI
  aiResponse        Json             @map("ai_response")   // Raw AI response
  insights          Json             // Parsed insights
  
  // Metadata
  model             String           // AI model used (e.g., grok-2-latest)
  tokensUsed        Int              @default(0) @map("tokens_used")
  processingTime    Int              @default(0) @map("processing_time") // milliseconds
  
  createdAt         DateTime         @default(now()) @map("created_at")

  @@index([userId])
  @@index([adAccountId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("ai_analysis_history")
}

model AIPreferences {
  id                      String   @id @default(cuid())
  userId                  String   @unique @map("user_id")
  
  // AI Settings
  autoAnalysisEnabled     Boolean  @default(true) @map("auto_analysis_enabled")
  alertsEnabled           Boolean  @default(true) @map("alerts_enabled")
  preferredModel          String   @default("grok-2-latest") @map("preferred_model")
  
  // Notification preferences
  notifyOnAnomalies       Boolean  @default(true) @map("notify_on_anomalies")
  notifyOnOpportunities   Boolean  @default(true) @map("notify_on_opportunities")
  minConfidenceThreshold  Float    @default(0.7) @map("min_confidence_threshold")
  
  // Analysis frequency
  analysisFrequency       String   @default("daily") // realtime, hourly, daily, weekly
  
  createdAt               DateTime @default(now()) @map("created_at")
  updatedAt               DateTime @updatedAt @map("updated_at")

  @@map("ai_preferences")
}

// Enums
enum AIEntityType {
  ACCOUNT
  CAMPAIGN
  AD_SET
  AD
}

enum AIInsightType {
  ANALYSIS
  OPTIMIZATION
  ANOMALY
  PREDICTION
  RECOMMENDATION
}

enum AIPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum AIInsightStatus {
  ACTIVE
  DISMISSED
  APPLIED
  EXPIRED
}
```

---

## 🔧 Implementation Roadmap

### **PHASE 1: Setup & Infrastructure** (1-2 ngày)

#### 1.1 Install Dependencies
```bash
bun add ai @ai-sdk/openai openai zod-to-json-schema
```

#### 1.2 Environment Variables
```env
# Add to .env
# X AI Configuration
XAI_API_KEY=your_xai_api_key_here
XAI_BASE_URL=https://api.x.ai/v1

# OpenAI Fallback (optional)
OPENAI_API_KEY=your_openai_api_key_here

# AI Features
ENABLE_AI_FEATURES=true
AI_RATE_LIMIT=100  # requests per hour
```

#### 1.3 Database Migration
```bash
# Update schema.prisma with new models
bun run prisma:generate
bun run prisma:push
```

#### 1.4 Core AI Configuration
**File**: `src/lib/ai/providers/xai-provider.ts`
```typescript
import { createOpenAI } from '@ai-sdk/openai';

export const xai = createOpenAI({
  apiKey: process.env.XAI_API_KEY || '',
  baseURL: process.env.XAI_BASE_URL || 'https://api.x.ai/v1',
});

export const MODELS = {
  GROK_2: 'grok-2-latest',
  GROK_2_VISION: 'grok-2-vision-latest',
} as const;

export type ModelType = typeof MODELS[keyof typeof MODELS];
```

---

### **PHASE 2: Core AI Services** (2 ngày)

#### 2.1 Ad Performance Analyzer
**File**: `src/lib/ai/services/ad-analyzer.ts`

**Chức năng**:
- Phân tích performance metrics của campaigns/ad sets/ads
- So sánh với historical data
- Xác định strengths và weaknesses
- Generate actionable insights

**Key Methods**:
```typescript
- analyzeCampaignPerformance(campaignData)
- compareAdSets(adSets[])
- identifyTopPerformers(entities[])
- generatePerformanceReport(adAccountId, dateRange)
```

#### 2.2 Optimization Engine
**File**: `src/lib/ai/services/optimizer.ts`

**Chức năng**:
- Đề xuất budget reallocation
- Suggest targeting improvements
- Recommend bid adjustments
- Creative optimization suggestions

**Key Methods**:
```typescript
- generateOptimizationPlan(campaignData)
- suggestBudgetAllocation(campaigns[])
- analyzeTargetingEfficiency(adSet)
- evaluateCreativePerformance(ads[])
```

#### 2.3 Anomaly Detection
**File**: `src/lib/ai/services/anomaly-detector.ts`

**Chức năng**:
- Real-time monitoring
- Pattern detection
- Alert generation
- Trend analysis

**Key Methods**:
```typescript
- detectAnomalies(timeSeriesData)
- identifyTrends(historicalData)
- predictFuturePerformance(campaignData)
- generateAlerts(anomalies[])
```

#### 2.4 Chat Service (Natural Language Interface)
**File**: `src/lib/ai/services/chat-service.ts`

**Chức năng**:
- Natural language queries
- Context-aware responses
- Data visualization suggestions
- Export capabilities

**Key Methods**:
```typescript
- streamChatResponse(message, context)
- queryAdData(naturalLanguageQuery)
- generateReport(reportType, entities[])
```

---

### **PHASE 3: API Endpoints** (1 ngày)

#### 3.1 Analysis API
**File**: `src/app/api/ai/analyze/route.ts`

```typescript
POST /api/ai/analyze
Body: {
  entityType: 'campaign' | 'ad_set' | 'ad' | 'account',
  entityId: string,
  analysisType: 'full' | 'quick' | 'comparison',
  dateRange?: { from: string, to: string }
}

Response: {
  insights: AIInsight[],
  summary: string,
  recommendations: Recommendation[],
  confidence: number
}
```

#### 3.2 Optimization API
**File**: `src/app/api/ai/optimize/route.ts`

```typescript
POST /api/ai/optimize
Body: {
  entityType: 'campaign' | 'ad_set' | 'ad',
  entityId: string,
  optimizationGoal: 'maximize_roas' | 'reduce_cpa' | 'increase_reach'
}

Response: {
  optimizations: OptimizationPlan[],
  expectedImpact: ImpactMetrics,
  implementation: ImplementationSteps[]
}
```

#### 3.3 Chat API (Streaming)
**File**: `src/app/api/ai/chat/route.ts`

```typescript
POST /api/ai/chat
Body: {
  message: string,
  context: {
    adAccountId: string,
    entities?: EntityReference[]
  },
  history?: ChatMessage[]
}

Response: StreamingTextResponse
```

#### 3.4 Insights API
**File**: `src/app/api/ai/insights/route.ts`

```typescript
GET /api/ai/insights?adAccountId=xxx&entityType=campaign&entityId=xxx
Response: {
  insights: AIInsight[],
  total: number,
  activeCount: number,
  criticalCount: number
}

PATCH /api/ai/insights/:id/dismiss
PATCH /api/ai/insights/:id/apply
```

---

### **PHASE 4: UI Components** (1-2 ngày)

#### 4.1 AI Insights Panel
**Component**: `src/components/ai/ai-insights-panel.tsx`

**Features**:
- Display AI insights for selected entity
- Filter by priority/category
- Dismiss or apply recommendations
- Historical insights view

**Placement**: Dashboard page, Campaign details, Ad Set details, Ad details

#### 4.2 AI Chat Dialog
**Component**: `src/components/ai/ai-chat-dialog.tsx`

**Features**:
- Floating chat button (bottom-right)
- Full-screen chat interface
- Context-aware suggestions
- Streaming responses
- Export chat history

**Placement**: Available globally via floating button

#### 4.3 Optimization Cards
**Component**: `src/components/ai/optimization-card.tsx`

**Features**:
- Visual representation of optimization opportunity
- Expected impact metrics
- One-click apply (if applicable)
- Detailed explanation

**Placement**: Dashboard, Campaign pages

#### 4.4 Anomaly Alerts
**Component**: `src/components/ai/anomaly-alerts.tsx`

**Features**:
- Real-time alert banner
- Severity indicators
- Quick action buttons
- Dismissible with reason

**Placement**: Dashboard header, Entity detail pages

#### 4.5 Dashboard AI Widget
**Component**: `src/components/dashboard/ai-assistant-widget.tsx`

**Features**:
- Summary of top insights
- Quick access to AI features
- Recent analyses
- Critical alerts

**Placement**: Dashboard page (new section)

---

### **PHASE 5: Prompts & Schemas** (1 ngày)

#### 5.1 System Prompts
**File**: `src/lib/ai/prompts/system-prompts.ts`

```typescript
export const SYSTEM_PROMPTS = {
  AD_ANALYZER: `You are an expert Facebook Ads analyst...`,
  OPTIMIZER: `You are a performance marketing optimization specialist...`,
  CHAT_ASSISTANT: `You are a helpful AI assistant for Facebook Ads management...`,
};
```

#### 5.2 Analysis Prompts
**File**: `src/lib/ai/prompts/analysis-prompts.ts`

**Templates cho**:
- Campaign performance analysis
- Ad set comparison
- Creative effectiveness evaluation
- Budget efficiency analysis

#### 5.3 Optimization Prompts
**File**: `src/lib/ai/prompts/optimization-prompts.ts`

**Templates cho**:
- Budget reallocation
- Targeting optimization
- Bid strategy recommendations
- Schedule optimization

#### 5.4 Zod Schemas
**File**: `src/lib/ai/schemas/analysis-schemas.ts`

```typescript
export const AnalysisResponseSchema = z.object({
  summary: z.string(),
  keyFindings: z.array(z.object({
    category: z.string(),
    finding: z.string(),
    impact: z.enum(['positive', 'negative', 'neutral']),
    confidence: z.number().min(0).max(1),
  })),
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    expectedImpact: z.string(),
    implementation: z.array(z.string()),
  })),
  metrics: z.object({
    performance_score: z.number(),
    optimization_potential: z.number(),
    risk_level: z.enum(['low', 'medium', 'high']),
  }),
});
```

---

### **PHASE 6: Integration & Testing** (1 ngày)

#### 6.1 Integration Points

**Dashboard Page**:
- Add AI Assistant Widget
- Show top insights
- Quick AI chat access

**Campaign Management Page**:
- AI insights tab for each campaign
- Inline optimization suggestions
- Bulk analysis actions

**Universal Data Tables**:
- AI insight badges on rows
- Bulk AI analysis
- Export with AI insights

#### 6.2 Testing Strategy

**Unit Tests**:
- AI service functions
- Prompt generation
- Response parsing
- Schema validation

**Integration Tests**:
- API endpoints
- Database operations
- AI provider communication

**E2E Tests** (Playwright):
```
e2e/tests/10-ai-features.spec.ts
- AI insights panel
- Chat interface
- Optimization suggestions
- Anomaly alerts
```

---

## 🔐 Security & Rate Limiting

### Rate Limiting
```typescript
// src/app/api/_lib/ai-rate-limiter.ts
export const aiRateLimiter = {
  analysis: 20, // per hour per user
  chat: 50,     // per hour per user
  optimize: 10, // per hour per user
};
```

### API Key Security
- Store X AI API key in environment variables
- Never expose in client-side code
- Use server-side only API routes
- Implement request signing if needed

### Data Privacy
- Anonymize sensitive data before sending to AI
- Don't send personal information (emails, names)
- Only send aggregated metrics and IDs
- Add user consent mechanism

---

## 💰 Cost Management

### Token Usage Optimization
1. **Caching Strategy**:
   - Cache AI responses for 1-4 hours
   - Reuse analysis for similar requests
   - Store insights in database

2. **Smart Context Management**:
   - Send only necessary data
   - Summarize large datasets
   - Use token-efficient prompts

3. **Batch Processing**:
   - Combine multiple analysis requests
   - Process during off-peak hours
   - Queue non-urgent requests

4. **Usage Monitoring**:
   ```prisma
   model AIUsageStats {
     id              String   @id @default(cuid())
     userId          String
     date            DateTime
     tokensUsed      Int
     requestCount    Int
     cost            Float
     @@index([userId, date])
   }
   ```

---

## 📈 Success Metrics

### Technical KPIs
- AI response time: < 5s for analysis
- API availability: > 99.5%
- Token cost per request: < $0.10
- Cache hit rate: > 70%

### Business KPIs
- User engagement with AI features: > 60%
- Applied optimization rate: > 30%
- Accuracy of predictions: > 80%
- User satisfaction score: > 4.5/5

### Performance Impact
- Reduction in manual analysis time: > 70%
- Improvement in ad performance: +15-25%
- Faster decision making: 3x faster

---

## 🚀 Deployment Checklist

### Pre-deployment
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] API rate limits configured
- [ ] Error tracking setup (Sentry)
- [ ] Monitoring dashboards created
- [ ] Documentation updated
- [ ] E2E tests passing

### Deployment
- [ ] Deploy to staging first
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Check AI response quality
- [ ] Verify cost tracking

### Post-deployment
- [ ] Enable feature flags gradually
- [ ] Monitor user feedback
- [ ] Track token usage
- [ ] Analyze performance metrics
- [ ] Gather user testimonials

---

## 🔄 Future Enhancements

### Phase 2 Features (Post-MVP)
1. **Advanced Analytics**:
   - Multi-variate testing suggestions
   - Attribution modeling
   - Customer lifetime value predictions
   - Cohort analysis

2. **Automation**:
   - Auto-apply low-risk optimizations
   - Scheduled analysis reports
   - Automated A/B test creation
   - Budget auto-adjustment

3. **Enhanced Chat**:
   - Voice input/output
   - Image analysis for ad creatives
   - Video analysis
   - Multi-language support

4. **Integrations**:
   - Export to Google Sheets
   - Slack notifications
   - Email reports
   - Zapier/Make.com webhooks

5. **Advanced AI**:
   - Fine-tuned models on user data
   - Custom prompts per user
   - Learning from user feedback
   - Reinforcement learning for optimization

---

## 📚 Documentation Requirements

### Developer Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] AI service architecture guide
- [ ] Prompt engineering guide
- [ ] Testing guide
- [ ] Deployment guide

### User Documentation
- [ ] AI features overview
- [ ] How to use AI chat
- [ ] Understanding AI insights
- [ ] Best practices for optimization
- [ ] FAQ section

### Internal Documentation
- [ ] Cost analysis report
- [ ] Performance benchmarks
- [ ] Known limitations
- [ ] Troubleshooting guide
- [ ] Rollout plan

---

## 🎯 Implementation Priority

### Must Have (P0)
1. Core AI analyzer service
2. Basic insights display
3. Analysis API endpoints
4. Database schema
5. Security & rate limiting

### Should Have (P1)
1. Optimization engine
2. AI chat interface
3. Anomaly detection
4. Dashboard widgets
5. User preferences

### Nice to Have (P2)
1. Advanced visualizations
2. Bulk operations
3. Export features
4. Custom prompts
5. Multi-language

---

## ⚠️ Risks & Mitigations

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|-----------|
| X AI API downtime | HIGH | Implement OpenAI fallback |
| High token costs | MEDIUM | Implement aggressive caching |
| Slow response times | MEDIUM | Use streaming, async processing |
| Data quality issues | MEDIUM | Add data validation layer |

### Business Risks
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Low user adoption | HIGH | Extensive onboarding, tutorials |
| Inaccurate predictions | HIGH | Confidence scores, disclaimers |
| Privacy concerns | MEDIUM | Clear data usage policies |
| Cost overruns | MEDIUM | Usage caps, alerts |

---

## 📞 Support & Maintenance

### Monitoring
- AI API response times
- Token usage per user/day
- Error rates by endpoint
- Cache hit/miss ratios
- User engagement metrics

### Alerts
- API failures
- High token usage
- Slow response times
- Database issues
- Rate limit exceeded

### Maintenance Tasks
- Weekly: Review AI responses quality
- Monthly: Optimize prompts
- Quarterly: Review costs
- Annual: Model evaluation & updates

---

## 🎓 Team Training Needs

### Developers
- Vercel AI SDK fundamentals
- Prompt engineering basics
- X AI API documentation
- Streaming responses handling
- Cost optimization strategies

### Product Team
- AI capabilities & limitations
- Interpreting AI insights
- Setting user expectations
- Feature prioritization

### Support Team
- Common AI issues
- How to help users
- When to escalate
- Cost monitoring

---

## 📊 Sample Use Cases

### Use Case 1: Campaign Performance Analysis
**Scenario**: User wants to understand why Campaign A is underperforming

**AI Flow**:
1. User selects Campaign A → Click "AI Analysis"
2. AI fetches campaign data, historical trends, benchmarks
3. AI analyzes metrics, identifies issues
4. AI generates insights:
   - "CTR is 45% below account average"
   - "Ad fatigue detected after day 7"
   - "Targeting too broad, wasting 30% of budget"
5. AI suggests specific actions with expected impact

### Use Case 2: Budget Optimization
**Scenario**: User has $10,000 budget, wants optimal allocation

**AI Flow**:
1. User clicks "Optimize Budget" for ad account
2. AI analyzes all active campaigns
3. AI simulates different budget scenarios
4. AI recommends:
   - Move $2,000 from Campaign C to Campaign A (Expected ROAS: 4.2x → 5.1x)
   - Pause Campaign B (negative ROAS)
   - Increase Campaign D by $1,500 (high potential)
5. User can apply with one click or adjust manually

### Use Case 3: Natural Language Query
**Scenario**: User asks "Which ads are performing best this week?"

**AI Flow**:
1. User types question in chat
2. AI understands intent, fetches data
3. AI responds:
   - "Top 5 ads by ROAS this week are..."
   - Shows table with metrics
   - Provides insights on why they're performing
   - Suggests: "Would you like me to analyze common patterns?"
4. Conversational follow-up

---

## 🏁 Summary

Kế hoạch này cung cấp một roadmap chi tiết để tích hợp AI vào Ad Manager Dashboard. Với timeline 5-7 ngày, chúng ta có thể có MVP hoạt động với các tính năng cốt lõi:

✅ **Core AI Analysis**: Phân tích performance và đưa ra insights  
✅ **Optimization Engine**: Đề xuất tối ưu hóa cụ thể  
✅ **Chat Interface**: Hỏi đáp bằng ngôn ngữ tự nhiên  
✅ **Dashboard Integration**: Tích hợp seamless vào UI hiện tại  
✅ **Cost Management**: Monitoring và optimization chi phí  

**Next Steps**: 
1. Review và approve plan này
2. Setup X AI API credentials
3. Begin Phase 1 implementation
4. Daily standup để track progress

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-05  
**Author**: AI Development Team  
**Status**: READY FOR REVIEW
