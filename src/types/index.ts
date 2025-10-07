export interface Campaign {
  id: string;
  name: string;
  status:
    | 'ACTIVE'
    | 'PAUSED'
    | 'DELETED'
    | 'ARCHIVED'
    | 'PENDING'
    | 'ENDED'
    | 'DISAPPROVED'
    | 'REMOVED';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cost_per_conversion: number;
  date_start: string;
  date_end: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdGroup {
  id: string;
  campaign_id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED' | 'PENDING' | 'ENDED';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  date_start: string;
  date_end: string;
  created_at?: string;
  updated_at?: string;
}

export interface Ad {
  id: string;
  ad_group_id: string;
  name: string;
  format: 'Image' | 'Video' | 'Carousel' | 'Story';
  status:
    | 'ACTIVE'
    | 'PAUSED'
    | 'DELETED'
    | 'ARCHIVED'
    | 'PENDING'
    | 'REVIEW'
    | 'REJECTED'
    | 'DISAPPROVED';
  impressions: number;
  clicks: number;
  ctr: number;
  engagement: number;
  spend: number;
  roas: number;
  date_start: string;
  date_end: string;
  created_at?: string;
  updated_at?: string;
}

// Alias for backward compatibility
export type Creative = Ad;

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// AI Types
export interface AIAnalysisResult {
  summary: string;
  findings: string[];
  recommendations: string[];
  expectedImpact: string;
  rawInsights: string;
  timestamp: string;
  model: string;
}

export interface AIAnalysisResponse {
  success: boolean;
  analysis: AIAnalysisResult;
  error?: string;
}
