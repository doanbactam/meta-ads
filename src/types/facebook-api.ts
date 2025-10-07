import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

export enum CampaignStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  DELETED = "DELETED",
  ARCHIVED = "ARCHIVED",
}

export enum CampaignEffectiveStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  DELETED = "DELETED",
  PENDING_REVIEW = "PENDING_REVIEW",
  DISAPPROVED = "DISAPPROVED",
  PREAPPROVED = "PREAPPROVED",
  PENDING_BILLING_INFO = "PENDING_BILLING_INFO",
  CAMPAIGN_PAUSED = "CAMPAIGN_PAUSED",
  ARCHIVED = "ARCHIVED",
  ADSET_PAUSED = "ADSET_PAUSED",
  IN_PROCESS = "IN_PROCESS",
  WITH_ISSUES = "WITH_ISSUES",
}

export enum CampaignObjective {
  APP_INSTALLS = "APP_INSTALLS",
  BRAND_AWARENESS = "BRAND_AWARENESS",
  CONVERSIONS = "CONVERSIONS",
  EVENT_RESPONSES = "EVENT_RESPONSES",
  LEAD_GENERATION = "LEAD_GENERATION",
  LINK_CLICKS = "LINK_CLICKS",
  MESSAGES = "MESSAGES",
  OUTCOME_AWARENESS = "OUTCOME_AWARENESS",
  OUTCOME_ENGAGEMENT = "OUTCOME_ENGAGEMENT",
  OUTCOME_LEADS = "OUTCOME_LEADS",
  OUTCOME_SALES = "OUTCOME_SALES",
  OUTCOME_TRAFFIC = "OUTCOME_TRAFFIC",
  PAGE_LIKES = "PAGE_LIKES",
  POST_ENGAGEMENT = "POST_ENGAGEMENT",
  PRODUCT_CATALOG_SALES = "PRODUCT_CATALOG_SALES",
  REACH = "REACH",
  STORE_VISITS = "STORE_VISITS",
  VIDEO_VIEWS = "VIDEO_VIEWS",
}

export enum AdSetStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  DELETED = "DELETED",
  ARCHIVED = "ARCHIVED",
}

export enum AdSetEffectiveStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  DELETED = "DELETED",
  PENDING_REVIEW = "PENDING_REVIEW",
  DISAPPROVED = "DISAPPROVED",
  PREAPPROVED = "PREAPPROVED",
  PENDING_BILLING_INFO = "PENDING_BILLING_INFO",
  CAMPAIGN_PAUSED = "CAMPAIGN_PAUSED",
  ARCHIVED = "ARCHIVED",
  ADSET_PAUSED = "ADSET_PAUSED",
}

export enum AdStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  DELETED = "DELETED",
  ARCHIVED = "ARCHIVED",
}

export enum AdEffectiveStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  DELETED = "DELETED",
  PENDING_REVIEW = "PENDING_REVIEW",
  DISAPPROVED = "DISAPPROVED",
  PREAPPROVED = "PREAPPROVED",
  PENDING_BILLING_INFO = "PENDING_BILLING_INFO",
  CAMPAIGN_PAUSED = "CAMPAIGN_PAUSED",
  ARCHIVED = "ARCHIVED",
  ADSET_PAUSED = "ADSET_PAUSED",
  AD_PAUSED = "AD_PAUSED",
  IN_PROCESS = "IN_PROCESS",
  WITH_ISSUES = "WITH_ISSUES",
}

export enum BidStrategy {
  LOWEST_COST_WITHOUT_CAP = "LOWEST_COST_WITHOUT_CAP",
  LOWEST_COST_WITH_BID_CAP = "LOWEST_COST_WITH_BID_CAP",
  COST_CAP = "COST_CAP",
  LOWEST_COST_WITH_MIN_ROAS = "LOWEST_COST_WITH_MIN_ROAS",
}

export enum BillingEvent {
  APP_INSTALLS = "APP_INSTALLS",
  CLICKS = "CLICKS",
  IMPRESSIONS = "IMPRESSIONS",
  LINK_CLICKS = "LINK_CLICKS",
  NONE = "NONE",
  OFFER_CLAIMS = "OFFER_CLAIMS",
  PAGE_LIKES = "PAGE_LIKES",
  POST_ENGAGEMENT = "POST_ENGAGEMENT",
  THRUPLAY = "THRUPLAY",
  PURCHASE = "PURCHASE",
  LISTING_INTERACTION = "LISTING_INTERACTION",
}

export enum OptimizationGoal {
  NONE = "NONE",
  APP_INSTALLS = "APP_INSTALLS",
  AD_RECALL_LIFT = "AD_RECALL_LIFT",
  ENGAGED_USERS = "ENGAGED_USERS",
  EVENT_RESPONSES = "EVENT_RESPONSES",
  IMPRESSIONS = "IMPRESSIONS",
  LEAD_GENERATION = "LEAD_GENERATION",
  QUALITY_LEAD = "QUALITY_LEAD",
  LINK_CLICKS = "LINK_CLICKS",
  OFFSITE_CONVERSIONS = "OFFSITE_CONVERSIONS",
  PAGE_LIKES = "PAGE_LIKES",
  POST_ENGAGEMENT = "POST_ENGAGEMENT",
  QUALITY_CALL = "QUALITY_CALL",
  REACH = "REACH",
  LANDING_PAGE_VIEWS = "LANDING_PAGE_VIEWS",
  VISIT_INSTAGRAM_PROFILE = "VISIT_INSTAGRAM_PROFILE",
  VALUE = "VALUE",
  THRUPLAY = "THRUPLAY",
  CONVERSATIONS = "CONVERSATIONS",
  DERIVED_EVENTS = "DERIVED_EVENTS",
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface FacebookAdAccountData {
  id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
  business?: {
    id: string;
    name: string;
  };
  access_type?: "OWNER" | "AGENCY" | "ASSIGNED";
  capabilities?: string[];
  funding_source?: string;
  spend_cap?: string;
  amount_spent?: string;
}

export interface FacebookCampaignData {
  id: string;
  name: string;
  status: CampaignStatus;
  effective_status?: CampaignEffectiveStatus;
  objective?: CampaignObjective;
  spend_cap?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  budget_remaining?: string;
  created_time: string;
  updated_time: string;
  start_time?: string;
  stop_time?: string;
  special_ad_categories?: string[];
  bid_strategy?: BidStrategy;
  account_id?: string;
}

export interface FacebookAdSetData {
  id: string;
  name: string;
  status: AdSetStatus;
  effective_status?: AdSetEffectiveStatus;
  campaign_id: string;
  daily_budget?: string;
  lifetime_budget?: string;
  budget_remaining?: string;
  bid_amount?: string;
  billing_event?: BillingEvent;
  optimization_goal?: OptimizationGoal;
  targeting?: Targeting;
  start_time?: string;
  end_time?: string;
  created_time: string;
  updated_time: string;
}

export interface FacebookAdData {
  id: string;
  name: string;
  status: AdStatus;
  effective_status?: AdEffectiveStatus;
  adset_id: string;
  campaign_id: string;
  creative?: {
    id: string;
    name?: string;
    object_story_spec?: any;
    asset_feed_spec?: any;
  };
  tracking_specs?: any[];
  conversion_specs?: any[];
  created_time: string;
  updated_time: string;
}

export interface Targeting {
  age_min?: number;
  age_max?: number;
  genders?: number[];
  geo_locations?: {
    countries?: string[];
    regions?: Array<{ key: string }>;
    cities?: Array<{ key: string }>;
    location_types?: string[];
  };
  interests?: Array<{ id: string; name?: string }>;
  behaviors?: Array<{ id: string; name?: string }>;
  custom_audiences?: Array<{ id: string; name?: string }>;
  excluded_custom_audiences?: Array<{ id: string; name?: string }>;
  flexible_spec?: any[];
  exclusions?: any;
  publisher_platforms?: string[];
  facebook_positions?: string[];
  instagram_positions?: string[];
  audience_network_positions?: string[];
  messenger_positions?: string[];
  device_platforms?: string[];
}

export interface Action {
  action_type: string;
  value: string;
}

export interface ActionValue {
  action_type: string;
  value: string;
}

export interface CostPerActionType {
  action_type: string;
  value: string;
}

export interface FacebookInsightsData {
  // Reach & Frequency
  impressions?: string;
  reach?: string;
  frequency?: string;

  // Engagement
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  cpp?: string;

  // Spend
  spend?: string;

  // Conversions
  actions?: Action[];
  action_values?: ActionValue[];
  conversions?: string;
  cost_per_action_type?: CostPerActionType[];

  // Video metrics
  video_avg_time_watched_actions?: Action[];
  video_p25_watched_actions?: Action[];
  video_p50_watched_actions?: Action[];
  video_p75_watched_actions?: Action[];
  video_p100_watched_actions?: Action[];

  // Date range
  date_start: string;
  date_stop: string;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateCampaignInput {
  name: string;
  objective: CampaignObjective;
  status?: CampaignStatus;
  special_ad_categories?: string[];
  daily_budget?: string;
  lifetime_budget?: string;
  bid_strategy?: BidStrategy;
  start_time?: string;
  stop_time?: string;
}

export interface UpdateCampaignInput {
  name?: string;
  status?: CampaignStatus;
  daily_budget?: string;
  lifetime_budget?: string;
  bid_strategy?: BidStrategy;
  start_time?: string;
  stop_time?: string;
}

export interface CreateAdSetInput {
  name: string;
  campaign_id: string;
  status?: AdSetStatus;
  billing_event: BillingEvent;
  optimization_goal: OptimizationGoal;
  bid_amount?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  targeting: Targeting;
  start_time?: string;
  end_time?: string;
}

export interface UpdateAdSetInput {
  name?: string;
  status?: AdSetStatus;
  bid_amount?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  targeting?: Targeting;
  start_time?: string;
  end_time?: string;
}

export interface CreateAdInput {
  name: string;
  adset_id: string;
  creative: {
    creative_id: string;
  };
  status?: AdStatus;
  tracking_specs?: any[];
  conversion_specs?: any[];
}

export interface UpdateAdInput {
  name?: string;
  status?: AdStatus;
  tracking_specs?: any[];
  conversion_specs?: any[];
}

export interface InsightsOptions {
  date_preset?: string;
  time_range?: {
    since: string;
    until: string;
  };
  level?: "account" | "campaign" | "adset" | "ad";
  fields?: string[];
  breakdowns?: string[];
  action_breakdowns?: string[];
  filtering?: any[];
  limit?: number;
}

export interface QueryOptions {
  fields?: string[];
  filtering?: any[];
  limit?: number;
  after?: string;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const FacebookAdAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  account_status: z.number(),
  currency: z.string(),
  timezone_name: z.string(),
  business: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  access_type: z.enum(["OWNER", "AGENCY", "ASSIGNED"]).optional(),
  capabilities: z.array(z.string()).optional(),
  funding_source: z.string().optional(),
  spend_cap: z.string().optional(),
  amount_spent: z.string().optional(),
});

export const FacebookCampaignSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.nativeEnum(CampaignStatus),
  effective_status: z.nativeEnum(CampaignEffectiveStatus).optional(),
  objective: z.nativeEnum(CampaignObjective).optional(),
  spend_cap: z.string().optional(),
  daily_budget: z.string().optional(),
  lifetime_budget: z.string().optional(),
  budget_remaining: z.string().optional(),
  created_time: z.string(),
  updated_time: z.string(),
  start_time: z.string().optional(),
  stop_time: z.string().optional(),
  special_ad_categories: z.array(z.string()).optional(),
  bid_strategy: z.nativeEnum(BidStrategy).optional(),
  account_id: z.string().optional(),
});

export const TargetingSchema = z.object({
  age_min: z.number().optional(),
  age_max: z.number().optional(),
  genders: z.array(z.number()).optional(),
  geo_locations: z
    .object({
      countries: z.array(z.string()).optional(),
      regions: z.array(z.object({ key: z.string() })).optional(),
      cities: z.array(z.object({ key: z.string() })).optional(),
      location_types: z.array(z.string()).optional(),
    })
    .optional(),
  interests: z.array(z.object({ id: z.string(), name: z.string().optional() })).optional(),
  behaviors: z.array(z.object({ id: z.string(), name: z.string().optional() })).optional(),
  custom_audiences: z.array(z.object({ id: z.string(), name: z.string().optional() })).optional(),
  excluded_custom_audiences: z
    .array(z.object({ id: z.string(), name: z.string().optional() }))
    .optional(),
  flexible_spec: z.array(z.any()).optional(),
  exclusions: z.any().optional(),
  publisher_platforms: z.array(z.string()).optional(),
  facebook_positions: z.array(z.string()).optional(),
  instagram_positions: z.array(z.string()).optional(),
  audience_network_positions: z.array(z.string()).optional(),
  messenger_positions: z.array(z.string()).optional(),
  device_platforms: z.array(z.string()).optional(),
});

export const FacebookAdSetSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.nativeEnum(AdSetStatus),
  effective_status: z.nativeEnum(AdSetEffectiveStatus).optional(),
  campaign_id: z.string(),
  daily_budget: z.string().optional(),
  lifetime_budget: z.string().optional(),
  budget_remaining: z.string().optional(),
  bid_amount: z.string().optional(),
  billing_event: z.nativeEnum(BillingEvent).optional(),
  optimization_goal: z.nativeEnum(OptimizationGoal).optional(),
  targeting: TargetingSchema.optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  created_time: z.string(),
  updated_time: z.string(),
});

export const FacebookAdSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.nativeEnum(AdStatus),
  effective_status: z.nativeEnum(AdEffectiveStatus).optional(),
  adset_id: z.string(),
  campaign_id: z.string(),
  creative: z
    .object({
      id: z.string(),
      name: z.string().optional(),
      object_story_spec: z.any().optional(),
      asset_feed_spec: z.any().optional(),
    })
    .optional(),
  tracking_specs: z.array(z.any()).optional(),
  conversion_specs: z.array(z.any()).optional(),
  created_time: z.string(),
  updated_time: z.string(),
});

export const ActionSchema = z.object({
  action_type: z.string(),
  value: z.string(),
});

export const FacebookInsightsSchema = z.object({
  impressions: z.string().optional(),
  reach: z.string().optional(),
  frequency: z.string().optional(),
  clicks: z.string().optional(),
  ctr: z.string().optional(),
  cpc: z.string().optional(),
  cpm: z.string().optional(),
  cpp: z.string().optional(),
  spend: z.string().optional(),
  actions: z.array(ActionSchema).optional(),
  action_values: z.array(ActionSchema).optional(),
  conversions: z.string().optional(),
  cost_per_action_type: z.array(ActionSchema).optional(),
  video_avg_time_watched_actions: z.array(ActionSchema).optional(),
  video_p25_watched_actions: z.array(ActionSchema).optional(),
  video_p50_watched_actions: z.array(ActionSchema).optional(),
  video_p75_watched_actions: z.array(ActionSchema).optional(),
  video_p100_watched_actions: z.array(ActionSchema).optional(),
  date_start: z.string(),
  date_stop: z.string(),
});
