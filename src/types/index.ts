export interface Campaign {
  id: string;
  name: string;
  status: 'Eligible' | 'Paused' | 'Disapproved' | 'Pending' | 'Ended' | 'Removed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cost_per_conversion: number;
  date_start: string;
  date_end: string;
  schedule: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdGroup {
  id: string;
  campaign_id: string;
  name: string;
  status: 'Active' | 'Paused' | 'Pending' | 'Ended';
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
  status: 'Active' | 'Paused' | 'Review' | 'Rejected';
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
