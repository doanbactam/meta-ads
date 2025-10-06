# AI Integration Implementation Guide

## 🚀 Quick Start Implementation

Đây là hướng dẫn từng bước để implement AI features theo plan.

---

## PHASE 1: Setup (30 phút - 1 giờ)

### Step 1.1: Install Dependencies

```bash
# Install AI SDK và dependencies
bun add ai @ai-sdk/openai openai zod-to-json-schema

# Verify installation
bun run typecheck
```

### Step 1.2: Environment Variables

**File**: `.env.local` (create if not exists)

```env
# X AI Configuration
XAI_API_KEY=xai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
XAI_BASE_URL=https://api.x.ai/v1

# OpenAI Fallback (optional but recommended)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# AI Features Configuration
ENABLE_AI_FEATURES=true
AI_RATE_LIMIT_PER_HOUR=100
AI_CACHE_TTL_MINUTES=60
MAX_AI_TOKENS_PER_REQUEST=4000

# Cost Limits (optional)
MAX_MONTHLY_AI_COST=1000
ALERT_THRESHOLD_COST=800
```

**Update**: `.env.example`

```env
# Add these lines to .env.example
# X AI / Grok Configuration
XAI_API_KEY=your_xai_api_key_here
XAI_BASE_URL=https://api.x.ai/v1
OPENAI_API_KEY=your_openai_api_key_here
ENABLE_AI_FEATURES=true
```

### Step 1.3: Update Database Schema

**File**: `src/prisma/schema.prisma`

Add the following at the end:

```prisma
// ============================================
// AI Features Tables
// ============================================

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

model AIInsight {
  id                String           @id @default(cuid())
  userId            String           @map("user_id")
  adAccountId       String?          @map("ad_account_id")
  entityType        AIEntityType     @map("entity_type")
  entityId          String?          @map("entity_id")
  insightType       AIInsightType    @map("insight_type")
  title             String
  description       String           @db.Text
  priority          AIPriority
  confidence        Float
  category          String
  
  // Structured data
  metrics           Json?
  recommendations   Json?
  expectedImpact    Json?            @map("expected_impact")
  
  // Status tracking
  status            AIInsightStatus  @default(ACTIVE)
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
  analysisType      String           @map("analysis_type")
  
  // Analysis data
  inputData         Json             @map("input_data")
  aiResponse        Json             @map("ai_response")
  insights          Json
  
  // Metadata
  model             String
  tokensUsed        Int              @default(0) @map("tokens_used")
  processingTime    Int              @default(0) @map("processing_time")
  
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
  analysisFrequency       String   @default("daily")
  
  createdAt               DateTime @default(now()) @map("created_at")
  updatedAt               DateTime @updatedAt @map("updated_at")

  @@map("ai_preferences")
}

model AIUsageStats {
  id              String   @id @default(cuid())
  userId          String   @map("user_id")
  date            DateTime
  tokensUsed      Int      @default(0) @map("tokens_used")
  requestCount    Int      @default(0) @map("request_count")
  cost            Float    @default(0)
  
  @@unique([userId, date])
  @@index([userId])
  @@index([date])
  @@map("ai_usage_stats")
}
```

Run migration:

```bash
bun run prisma:generate
bun run prisma:push
```

---

## PHASE 2: Core AI Provider Setup

### Step 2.1: X AI Provider Configuration

**File**: `src/lib/ai/providers/xai-provider.ts`

```typescript
import { createOpenAI } from '@ai-sdk/openai';

// X AI (Grok) Provider
export const xai = createOpenAI({
  apiKey: process.env.XAI_API_KEY || '',
  baseURL: process.env.XAI_BASE_URL || 'https://api.x.ai/v1',
  name: 'xai',
});

// Available Models
export const MODELS = {
  GROK_2: 'grok-2-latest',
  GROK_2_VISION: 'grok-2-vision-latest',
} as const;

export type ModelType = (typeof MODELS)[keyof typeof MODELS];

// Default model configuration
export const DEFAULT_MODEL_CONFIG = {
  model: MODELS.GROK_2,
  temperature: 0.7,
  maxTokens: 4000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

// Validate provider is configured
export function isXAIConfigured(): boolean {
  return !!(process.env.XAI_API_KEY && process.env.XAI_BASE_URL);
}
```

**File**: `src/lib/ai/providers/openai-provider.ts`

```typescript
import { createOpenAI } from '@ai-sdk/openai';

// OpenAI Fallback Provider
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  compatibility: 'strict',
});

export const OPENAI_MODELS = {
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',
} as const;

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
```

**File**: `src/lib/ai/providers/index.ts`

```typescript
import { isOpenAIConfigured, openai, OPENAI_MODELS } from './openai-provider';
import { isXAIConfigured, MODELS, xai } from './xai-provider';

// Get the best available provider
export function getAIProvider() {
  if (isXAIConfigured()) {
    console.log('Using X AI (Grok) provider');
    return { provider: xai, model: MODELS.GROK_2, name: 'xai' };
  }

  if (isOpenAIConfigured()) {
    console.log('Using OpenAI provider as fallback');
    return { provider: openai, model: OPENAI_MODELS.GPT_4O_MINI, name: 'openai' };
  }

  throw new Error('No AI provider configured. Please set XAI_API_KEY or OPENAI_API_KEY');
}

export { MODELS, xai, openai };
```

---

## PHASE 3: TypeScript Types

**File**: `src/types/ai.ts`

```typescript
import type { AIEntityType, AIInsightType, AIPriority, AIInsightStatus } from '@prisma/client';

export interface AIAnalysisRequest {
  entityType: AIEntityType;
  entityId: string;
  analysisType: 'full' | 'quick' | 'comparison';
  dateRange?: {
    from: string;
    to: string;
  };
  includeRecommendations?: boolean;
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  priority: AIPriority;
  confidence: number;
  category: string;
  insightType: AIInsightType;
  recommendations?: AIRecommendation[];
  expectedImpact?: ExpectedImpact;
  status: AIInsightStatus;
  createdAt: string;
}

export interface AIRecommendation {
  title: string;
  description: string;
  priority: AIPriority;
  expectedImpact: string;
  implementation: string[];
  confidence: number;
}

export interface ExpectedImpact {
  metric: string;
  currentValue: number;
  projectedValue: number;
  improvement: number;
  confidence: number;
}

export interface AnalysisResult {
  summary: string;
  keyFindings: KeyFinding[];
  recommendations: AIRecommendation[];
  metrics: PerformanceMetrics;
  insights: AIInsight[];
}

export interface KeyFinding {
  category: string;
  finding: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  details?: string;
}

export interface PerformanceMetrics {
  performanceScore: number;
  optimizationPotential: number;
  riskLevel: 'low' | 'medium' | 'high';
  benchmarkComparison?: {
    metric: string;
    yourValue: number;
    benchmark: number;
    difference: number;
  }[];
}

export interface OptimizationPlan {
  goal: string;
  optimizations: Optimization[];
  expectedImpact: ImpactMetrics;
  implementation: ImplementationStep[];
  totalConfidence: number;
}

export interface Optimization {
  type: 'budget' | 'targeting' | 'creative' | 'bid' | 'schedule';
  action: string;
  description: string;
  expectedImpact: string;
  priority: AIPriority;
  risk: 'low' | 'medium' | 'high';
}

export interface ImpactMetrics {
  estimatedCostSaving?: number;
  estimatedRevenueIncrease?: number;
  estimatedRoasImprovement?: number;
  estimatedCtrImprovement?: number;
  timeToImpact: string;
}

export interface ImplementationStep {
  step: number;
  action: string;
  description: string;
  automated: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ChatContext {
  adAccountId: string;
  entities?: {
    type: AIEntityType;
    id: string;
    name?: string;
  }[];
  dateRange?: {
    from: string;
    to: string;
  };
}
```

---

## PHASE 4: Zod Schemas

**File**: `src/lib/ai/schemas/analysis-schemas.ts`

```typescript
import { z } from 'zod';

export const KeyFindingSchema = z.object({
  category: z.string(),
  finding: z.string(),
  impact: z.enum(['positive', 'negative', 'neutral']),
  confidence: z.number().min(0).max(1),
  details: z.string().optional(),
});

export const AIRecommendationSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  expectedImpact: z.string(),
  implementation: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export const PerformanceMetricsSchema = z.object({
  performanceScore: z.number().min(0).max(100),
  optimizationPotential: z.number().min(0).max(100),
  riskLevel: z.enum(['low', 'medium', 'high']),
  benchmarkComparison: z
    .array(
      z.object({
        metric: z.string(),
        yourValue: z.number(),
        benchmark: z.number(),
        difference: z.number(),
      })
    )
    .optional(),
});

export const AnalysisResponseSchema = z.object({
  summary: z.string(),
  keyFindings: z.array(KeyFindingSchema),
  recommendations: z.array(AIRecommendationSchema),
  metrics: PerformanceMetricsSchema,
});

export type AnalysisResponse = z.infer<typeof AnalysisResponseSchema>;

// Helper to convert schema to JSON Schema for AI structured output
import zodToJsonSchema from 'zod-to-json-schema';

export const AnalysisResponseJsonSchema = zodToJsonSchema(AnalysisResponseSchema, {
  name: 'AnalysisResponse',
  target: 'openApi3',
});
```

**File**: `src/lib/ai/schemas/optimization-schemas.ts`

```typescript
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

export const OptimizationSchema = z.object({
  type: z.enum(['budget', 'targeting', 'creative', 'bid', 'schedule']),
  action: z.string(),
  description: z.string(),
  expectedImpact: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  risk: z.enum(['low', 'medium', 'high']),
});

export const ImpactMetricsSchema = z.object({
  estimatedCostSaving: z.number().optional(),
  estimatedRevenueIncrease: z.number().optional(),
  estimatedRoasImprovement: z.number().optional(),
  estimatedCtrImprovement: z.number().optional(),
  timeToImpact: z.string(),
});

export const ImplementationStepSchema = z.object({
  step: z.number(),
  action: z.string(),
  description: z.string(),
  automated: z.boolean(),
});

export const OptimizationPlanSchema = z.object({
  goal: z.string(),
  optimizations: z.array(OptimizationSchema),
  expectedImpact: ImpactMetricsSchema,
  implementation: z.array(ImplementationStepSchema),
  totalConfidence: z.number().min(0).max(1),
});

export type OptimizationPlan = z.infer<typeof OptimizationPlanSchema>;

export const OptimizationPlanJsonSchema = zodToJsonSchema(OptimizationPlanSchema, {
  name: 'OptimizationPlan',
  target: 'openApi3',
});
```

---

## PHASE 5: System Prompts

**File**: `src/lib/ai/prompts/system-prompts.ts`

```typescript
export const SYSTEM_PROMPTS = {
  AD_ANALYZER: `You are an expert Facebook Ads analyst with 10+ years of experience in performance marketing. Your role is to:

1. Analyze campaign, ad set, and ad performance data
2. Identify patterns, trends, and anomalies
3. Provide actionable, data-driven insights
4. Make specific, measurable recommendations
5. Explain your reasoning clearly and concisely

Guidelines:
- Focus on metrics that matter: ROAS, CPA, CTR, Conversion Rate
- Consider industry benchmarks and best practices
- Identify quick wins and long-term optimizations
- Be specific with numbers and percentages
- Acknowledge limitations and confidence levels
- Prioritize recommendations by impact and effort

Always structure your analysis with:
- Executive Summary
- Key Findings (with confidence scores)
- Specific Recommendations (prioritized)
- Expected Impact (quantified when possible)
- Implementation Steps

Be direct, actionable, and data-driven.`,

  OPTIMIZER: `You are a performance marketing optimization specialist with expertise in Facebook Ads. Your role is to:

1. Analyze current campaign performance and budget allocation
2. Identify optimization opportunities
3. Simulate different scenarios and outcomes
4. Provide specific, actionable optimization plans
5. Quantify expected impact

Focus areas:
- Budget reallocation for maximum ROAS
- Targeting refinement
- Bid strategy optimization
- Creative performance enhancement
- Schedule and placement optimization

For each optimization:
- Explain the rationale
- Quantify expected impact
- Assess risk level
- Provide step-by-step implementation
- Include fallback strategies

Be precise, quantitative, and realistic about outcomes.`,

  CHAT_ASSISTANT: `You are a helpful AI assistant specializing in Facebook Ads management. You help users:

1. Understand their advertising data
2. Answer questions about campaign performance
3. Provide recommendations and best practices
4. Generate reports and summaries
5. Troubleshoot issues

Communication style:
- Friendly but professional
- Clear and concise
- Use specific numbers and data
- Ask clarifying questions when needed
- Provide examples and context
- Use visualizations when helpful

Capabilities:
- Access to user's ad account data
- Performance analysis
- Optimization suggestions
- Historical comparisons
- Benchmarking against industry standards

Always:
- Cite specific data points
- Explain your reasoning
- Offer next steps
- Ask if user needs more details
- Suggest related actions

Be helpful, accurate, and actionable.`,

  ANOMALY_DETECTOR: `You are an AI system specialized in detecting anomalies and unusual patterns in Facebook Ads data. Your role is to:

1. Monitor key metrics for sudden changes
2. Identify statistically significant deviations
3. Determine root causes
4. Assess severity and urgency
5. Recommend immediate actions

Detection criteria:
- Statistical significance (> 2 standard deviations)
- Business impact (cost, revenue, conversions)
- Trend analysis (is it temporary or sustained?)
- Historical patterns (is this expected?)

For each anomaly:
- Describe what changed
- Quantify the impact
- Assess severity (low/medium/high/critical)
- Provide likely causes
- Recommend immediate actions
- Suggest preventive measures

Be vigilant, accurate, and timely.`,
};
```

**File**: `src/lib/ai/prompts/analysis-prompts.ts`

```typescript
import type { Campaign, AdGroup, Ad } from '@/types';

export function buildCampaignAnalysisPrompt(campaign: Campaign, historicalData?: any) {
  return `Analyze this Facebook ad campaign in detail:

**Campaign Details:**
- Name: ${campaign.name}
- Status: ${campaign.status}
- Budget: $${campaign.budget}
- Spent: $${campaign.spent} (${((campaign.spent / campaign.budget) * 100).toFixed(1)}% of budget)
- Date Range: ${campaign.date_start} to ${campaign.date_end}

**Performance Metrics:**
- Impressions: ${campaign.impressions.toLocaleString()}
- Clicks: ${campaign.clicks.toLocaleString()}
- CTR: ${(campaign.ctr * 100).toFixed(2)}%
- Conversions: ${campaign.conversions}
- Cost per Conversion: $${campaign.cost_per_conversion.toFixed(2)}
- ROAS: ${(campaign.spent > 0 ? (campaign.conversions * 50) / campaign.spent : 0).toFixed(2)}x (assuming $50 avg order value)

${historicalData ? `**Historical Context:**\n${JSON.stringify(historicalData, null, 2)}` : ''}

**Analysis Required:**
1. Overall performance assessment
2. Strengths and weaknesses
3. Comparison to industry benchmarks (assume e-commerce averages: CTR 1.5%, CPC $0.80, Conv Rate 2%)
4. Specific areas for improvement
5. Top 3 actionable recommendations
6. Expected impact of recommendations

Provide a comprehensive analysis with specific, data-driven insights.`;
}

export function buildAdSetComparisonPrompt(adSets: AdGroup[]) {
  const adSetsData = adSets
    .map(
      (adSet, idx) => `
**Ad Set ${idx + 1}: ${adSet.name}**
- Status: ${adSet.status}
- Budget: $${adSet.budget} | Spent: $${adSet.spent}
- Impressions: ${adSet.impressions.toLocaleString()}
- Clicks: ${adSet.clicks.toLocaleString()}
- CTR: ${(adSet.ctr * 100).toFixed(2)}%
- CPC: $${adSet.cpc.toFixed(2)}
- Conversions: ${adSet.conversions}
`
    )
    .join('\n');

  return `Compare these ${adSets.length} ad sets and provide insights:

${adSetsData}

**Analysis Required:**
1. Rank ad sets by overall performance
2. Identify top performers and why they succeed
3. Identify underperformers and root causes
4. Find patterns and correlations
5. Budget reallocation recommendations
6. Specific actions for each ad set

Provide a detailed comparison with actionable insights.`;
}

export function buildCreativeAnalysisPrompt(ads: Ad[]) {
  const adsData = ads
    .map(
      (ad, idx) => `
**Ad ${idx + 1}: ${ad.name}**
- Format: ${ad.format}
- Status: ${ad.status}
- Impressions: ${ad.impressions.toLocaleString()}
- Clicks: ${ad.clicks.toLocaleString()}
- CTR: ${(ad.ctr * 100).toFixed(2)}%
- Engagement: ${ad.engagement}
- Spend: $${ad.spend.toFixed(2)}
- ROAS: ${ad.roas.toFixed(2)}x
`
    )
    .join('\n');

  return `Analyze these ${ads.length} ad creatives:

${adsData}

**Analysis Required:**
1. Rank creatives by effectiveness
2. Identify winning creative patterns
3. Format performance (Image vs Video vs Carousel)
4. Engagement vs Conversion analysis
5. Creative fatigue detection
6. Recommendations for new creatives
7. A/B testing suggestions

Provide detailed creative insights with specific recommendations.`;
}
```

---

## PHASE 6: First AI Service

**File**: `src/lib/ai/services/ad-analyzer.ts`

```typescript
import { generateObject } from 'ai';
import { getAIProvider } from '../providers';
import { AnalysisResponseSchema } from '../schemas/analysis-schemas';
import { SYSTEM_PROMPTS } from '../prompts/system-prompts';
import { buildCampaignAnalysisPrompt } from '../prompts/analysis-prompts';
import type { Campaign } from '@/types';
import type { AnalysisResult } from '@/types/ai';

export class AdAnalyzer {
  private provider;
  private model;

  constructor() {
    const { provider, model } = getAIProvider();
    this.provider = provider;
    this.model = model;
  }

  async analyzeCampaign(campaign: Campaign, historicalData?: any): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      const result = await generateObject({
        model: this.provider(this.model),
        schema: AnalysisResponseSchema,
        system: SYSTEM_PROMPTS.AD_ANALYZER,
        prompt: buildCampaignAnalysisPrompt(campaign, historicalData),
        temperature: 0.7,
        maxTokens: 4000,
      });

      const processingTime = Date.now() - startTime;

      console.log(`Campaign analysis completed in ${processingTime}ms`);
      console.log(`Tokens used: ${result.usage?.totalTokens || 'unknown'}`);

      // Transform to our internal format
      const analysisResult: AnalysisResult = {
        summary: result.object.summary,
        keyFindings: result.object.keyFindings,
        recommendations: result.object.recommendations,
        metrics: result.object.metrics,
        insights: this.convertToInsights(result.object, campaign),
      };

      return analysisResult;
    } catch (error) {
      console.error('Error analyzing campaign:', error);
      throw new Error(`Failed to analyze campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private convertToInsights(analysisData: any, campaign: Campaign) {
    // Convert analysis to AIInsight format for storage
    return analysisData.recommendations.map((rec: any, idx: number) => ({
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
      confidence: rec.confidence,
      category: 'performance',
      insightType: 'RECOMMENDATION',
      entityType: 'CAMPAIGN',
      entityId: campaign.id,
      recommendations: [rec],
      expectedImpact: {
        metric: 'ROAS',
        improvement: 15, // This should be calculated from rec.expectedImpact
      },
    }));
  }
}

// Export singleton
export const adAnalyzer = new AdAnalyzer();
```

---

## PHASE 7: First API Endpoint

**File**: `src/app/api/ai/analyze/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { adAnalyzer } from '@/lib/ai/services/ad-analyzer';
import { getCampaignById } from '@/lib/server/api/campaigns';

// Request validation schema
const AnalyzeRequestSchema = z.object({
  entityType: z.enum(['CAMPAIGN', 'AD_SET', 'AD', 'ACCOUNT']),
  entityId: z.string(),
  analysisType: z.enum(['full', 'quick', 'comparison']).default('full'),
  includeRecommendations: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate request body
    const body = await request.json();
    const { entityType, entityId, analysisType, includeRecommendations } =
      AnalyzeRequestSchema.parse(body);

    // 3. Check rate limits (implement rate limiting)
    // ... rate limit check ...

    // 4. Fetch entity data
    let entityData;
    if (entityType === 'CAMPAIGN') {
      entityData = await getCampaignById(entityId, userId);
      if (!entityData) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
    }
    // ... handle other entity types ...

    // 5. Get historical data (optional)
    // const historicalData = await getHistoricalData(entityId, entityType);

    // 6. Perform AI analysis
    const analysisResult = await adAnalyzer.analyzeCampaign(entityData);

    // 7. Save to database
    const savedInsights = await prisma.$transaction(
      analysisResult.insights.map((insight) =>
        prisma.aIInsight.create({
          data: {
            userId,
            adAccountId: entityData.adAccountId,
            entityType,
            entityId,
            title: insight.title,
            description: insight.description,
            priority: insight.priority,
            confidence: insight.confidence,
            category: insight.category,
            insightType: insight.insightType,
            metrics: insight.recommendations ? JSON.parse(JSON.stringify(insight.recommendations)) : null,
            status: 'ACTIVE',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        })
      )
    );

    // 8. Track usage
    await prisma.aIUsageStats.upsert({
      where: {
        userId_date: {
          userId,
          date: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      create: {
        userId,
        date: new Date(new Date().setHours(0, 0, 0, 0)),
        requestCount: 1,
        tokensUsed: 1000, // Get from AI response
        cost: 0.01, // Calculate based on tokens
      },
      update: {
        requestCount: { increment: 1 },
        tokensUsed: { increment: 1000 },
        cost: { increment: 0.01 },
      },
    });

    // 9. Return results
    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      insights: savedInsights,
    });
  } catch (error) {
    console.error('AI analysis error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

---

## PHASE 8: React Hook

**File**: `src/hooks/use-ai-analysis.ts`

```typescript
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AIAnalysisRequest, AnalysisResult } from '@/types/ai';

export function useAIAnalysis() {
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: async (request: AIAnalysisRequest) => {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Analysis failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Analysis complete!');
      // Invalidate insights query to refetch
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
    },
    onError: (error: Error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  return {
    analyze: analyzeMutation.mutate,
    isAnalyzing: analyzeMutation.isPending,
    analysisResult: analyzeMutation.data,
    error: analyzeMutation.error,
  };
}

export function useAIInsights(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['ai-insights', entityType, entityId],
    queryFn: async () => {
      const response = await fetch(`/api/ai/insights?entityType=${entityType}&entityId=${entityId}`);
      if (!response.ok) throw new Error('Failed to fetch insights');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
```

---

## PHASE 9: First UI Component

**File**: `src/components/ai/ai-insights-panel.tsx`

```typescript
'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Info, Lightbulb, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAIAnalysis, useAIInsights } from '@/hooks/use-ai-analysis';
import type { AIInsight } from '@/types/ai';

interface AIInsightsPanelProps {
  entityType: 'CAMPAIGN' | 'AD_SET' | 'AD' | 'ACCOUNT';
  entityId: string;
  entityName?: string;
}

export function AIInsightsPanel({ entityType, entityId, entityName }: AIInsightsPanelProps) {
  const { analyze, isAnalyzing } = useAIAnalysis();
  const { data: insights, isLoading } = useAIInsights(entityType, entityId);
  const [filter, setFilter] = useState<'all' | 'high' | 'critical'>('all');

  const handleAnalyze = () => {
    analyze({
      entityType,
      entityId,
      analysisType: 'full',
      includeRecommendations: true,
    });
  };

  const filteredInsights = insights?.insights?.filter((insight: AIInsight) => {
    if (filter === 'all') return true;
    return insight.priority === filter.toUpperCase();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Insights
            {entityName && <span className="text-muted-foreground text-sm">for {entityName}</span>}
          </h3>
          <p className="text-sm text-muted-foreground">
            AI-powered analysis and optimization recommendations
          </p>
        </div>
        <Button onClick={handleAnalyze} disabled={isAnalyzing} size="sm">
          {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({insights?.insights?.length || 0})
        </Button>
        <Button
          variant={filter === 'high' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('high')}
        >
          High Priority
        </Button>
        <Button
          variant={filter === 'critical' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('critical')}
        >
          Critical
        </Button>
      </div>

      {/* Insights List */}
      {isLoading ? (
        <div>Loading insights...</div>
      ) : filteredInsights?.length > 0 ? (
        <div className="space-y-3">
          {filteredInsights.map((insight: AIInsight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Info className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No insights yet. Run an analysis to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InsightCard({ insight }: { insight: AIInsight }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const priorityColors = {
    LOW: 'bg-blue-500/10 text-blue-500',
    MEDIUM: 'bg-yellow-500/10 text-yellow-500',
    HIGH: 'bg-orange-500/10 text-orange-500',
    CRITICAL: 'bg-red-500/10 text-red-500',
  };

  const priorityIcons = {
    LOW: Info,
    MEDIUM: Lightbulb,
    HIGH: AlertCircle,
    CRITICAL: AlertCircle,
  };

  const Icon = priorityIcons[insight.priority];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Icon className={`h-5 w-5 mt-0.5 ${priorityColors[insight.priority].split(' ')[1]}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base">{insight.title}</CardTitle>
                <Badge variant="outline" className={priorityColors[insight.priority]}>
                  {insight.priority}
                </Badge>
              </div>
              <CardDescription>{insight.description}</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setDismissed(true)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
            <span>•</span>
            <span>{insight.category}</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              Learn More
            </Button>
            <Button size="sm">Apply</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Testing the Implementation

### Manual Testing Steps

1. **Start dev server**:
   ```bash
   bun run dev
   ```

2. **Test AI Analysis API**:
   ```bash
   curl -X POST http://localhost:3000/api/ai/analyze \
     -H "Content-Type: application/json" \
     -d '{
       "entityType": "CAMPAIGN",
       "entityId": "your-campaign-id",
       "analysisType": "full"
     }'
   ```

3. **Check UI**:
   - Navigate to a campaign page
   - Click "AI Insights" tab
   - Click "Run Analysis"
   - Verify insights appear

4. **Check Database**:
   ```bash
   bun run prisma:studio
   ```
   - Verify `AIInsight` records created
   - Check `AIUsageStats` tracking

---

## Next Steps

After completing this basic implementation:

1. **Add Error Handling**: Implement comprehensive error boundaries
2. **Add Caching**: Cache AI responses to reduce costs
3. **Add Rate Limiting**: Protect API from abuse
4. **Add More Services**: Implement Optimizer, Anomaly Detector, Chat
5. **Add More UI**: Chat dialog, optimization cards, alerts
6. **Add Tests**: Unit tests, integration tests, E2E tests

---

## Troubleshooting

### Common Issues

**Issue**: "No AI provider configured"
**Fix**: Check `.env.local` has `XAI_API_KEY` set

**Issue**: AI responses are slow
**Fix**: Reduce `maxTokens`, implement streaming, add caching

**Issue**: High costs
**Fix**: Implement aggressive caching, reduce analysis frequency, use cheaper models for simple tasks

**Issue**: Inaccurate insights
**Fix**: Improve prompts, add more context, increase temperature for creativity

---

**Last Updated**: 2025-10-05  
**Status**: READY FOR IMPLEMENTATION
