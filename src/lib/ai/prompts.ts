import type { Campaign } from '@/types';

/**
 * Build campaign analysis prompt with campaign data and industry benchmarks
 */
export function buildCampaignAnalysisPrompt(campaign: Campaign): string {
  const ctr = campaign.ctr * 100;
  const cpc = campaign.clicks > 0 ? campaign.spent / campaign.clicks : 0;
  const conversionRate = campaign.impressions > 0 ? (campaign.conversions / campaign.impressions) * 100 : 0;
  const budgetUtilization = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;

  return `Analyze this Facebook ad campaign and provide actionable insights:

CAMPAIGN DATA:
Name: ${campaign.name}
Status: ${campaign.status}
Budget: $${campaign.budget.toFixed(2)} | Spent: $${campaign.spent.toFixed(2)} (${budgetUtilization.toFixed(1)}% utilized)
Date Range: ${campaign.date_start} to ${campaign.date_end}

PERFORMANCE METRICS:
• Impressions: ${campaign.impressions.toLocaleString()}
• Clicks: ${campaign.clicks.toLocaleString()}
• CTR: ${ctr.toFixed(2)}%
• CPC: $${cpc.toFixed(2)}
• Conversions: ${campaign.conversions}
• Cost per Conversion: $${campaign.cost_per_conversion?.toFixed(2) || 0}
• Conversion Rate: ${conversionRate.toFixed(2)}%

INDUSTRY BENCHMARKS (E-commerce):
• Average CTR: 1.5%
• Average CPC: $0.80
• Average Conversion Rate: 2.0%
• Average CPA: $25.00

INSTRUCTIONS:
Provide a comprehensive analysis in the following format:

1. PERFORMANCE SUMMARY (1-2 sentences)
Brief overall assessment of campaign performance.

2. KEY FINDINGS (3-5 bullet points)
• What's working well
• What's underperforming
• Notable patterns or trends
• Comparison to benchmarks

3. ACTIONABLE RECOMMENDATIONS (3-5 prioritized items)
1. [Highest priority] Specific action with reasoning
2. [Medium priority] Specific action with reasoning
3. [Lower priority] Specific action with reasoning

4. EXPECTED IMPACT
If recommendations are applied, what improvements can be expected? (Be specific with percentages or metrics)

Be data-driven, specific, and actionable. Focus on insights that can immediately improve campaign performance.`;
}

/**
 * Build prompt for comparing multiple campaigns
 */
export function buildCampaignComparisonPrompt(campaigns: Campaign[]): string {
  const campaignData = campaigns
    .map(
      (c, i) => `
CAMPAIGN ${i + 1}: ${c.name}
• Budget: $${c.budget} | Spent: $${c.spent}
• Impressions: ${c.impressions.toLocaleString()}
• Clicks: ${c.clicks.toLocaleString()}
• CTR: ${(c.ctr * 100).toFixed(2)}%
• Conversions: ${c.conversions}
• CPA: $${c.cost_per_conversion?.toFixed(2) || 0}
`
    )
    .join('\n');

  return `Compare these ${campaigns.length} Facebook ad campaigns and provide insights:

${campaignData}

Provide:
1. Performance ranking (best to worst)
2. Key differences between campaigns
3. What the best performer is doing right
4. What underperformers should learn from top performer
5. Specific recommendations for each campaign

Be specific and actionable.`;
}
