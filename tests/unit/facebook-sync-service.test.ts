import { describe, expect, it, beforeEach } from 'vitest';

const mockApiInstance = {
  getCampaigns: vi.fn(),
  getCampaignInsights: vi.fn(),
  getAdSets: vi.fn(),
  getAdSetInsights: vi.fn(),
  getAds: vi.fn(),
  getAdInsights: vi.fn(),
};

const FacebookMarketingAPIMock = vi.fn(() => mockApiInstance);

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(),
}));

vi.mock('@/lib/server/facebook-api', () => ({
  FacebookMarketingAPI: FacebookMarketingAPIMock,
}));

const mockPrisma = {
  adAccount: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  campaign: {
    upsert: vi.fn(),
    findMany: vi.fn(),
  },
  adGroup: {
    upsert: vi.fn(),
    findMany: vi.fn(),
  },
  creative: {
    upsert: vi.fn(),
  },
};

vi.mock('@/lib/server/prisma', () => ({
  prisma: mockPrisma,
}), { virtual: true });

let FacebookSyncServiceClass: typeof import('@/lib/server/facebook-sync-service').FacebookSyncService;

const campaignInsights = {
  impressions: '1000',
  clicks: '100',
  spend: '5000',
  ctr: '2.5',
  conversions: '10',
  costPerConversion: '500',
};

describe('FacebookSyncService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    ({ FacebookSyncService: FacebookSyncServiceClass } = await import(
      '@/lib/server/facebook-sync-service'
    ));

    mockApiInstance.getCampaigns.mockResolvedValue([
      {
        id: 'cmp_1',
        name: 'Campaign 1',
        status: 'ACTIVE',
        objective: 'LINK_CLICKS',
        dailyBudget: '1000',
        lifetimeBudget: '0',
      },
    ]);
    mockApiInstance.getCampaignInsights.mockResolvedValue(campaignInsights);
    mockApiInstance.getAdSets.mockResolvedValue([
      {
        id: 'adset_1',
        name: 'Ad Set 1',
        status: 'ACTIVE',
        effective_status: 'ACTIVE',
        daily_budget: '500',
        lifetime_budget: '0',
        bid_amount: '100',
        targeting: {},
      },
    ]);
    mockApiInstance.getAdSetInsights.mockResolvedValue(campaignInsights);
    mockApiInstance.getAds.mockResolvedValue([
      {
        id: 'ad_1',
        name: 'Ad 1',
        status: 'ACTIVE',
        effective_status: 'ACTIVE',
        creative: { id: 'creative_1' },
      },
    ]);
    mockApiInstance.getAdInsights.mockResolvedValue(campaignInsights);

    const oldDate = new Date(Date.now() - 11 * 60 * 1000);
    mockPrisma.adAccount.findUnique.mockResolvedValue({ lastSyncedAt: oldDate });
    mockPrisma.adAccount.update.mockResolvedValue({});
    mockPrisma.campaign.findMany.mockResolvedValue([
      { id: 'campaign-db', facebookCampaignId: 'cmp_1' },
    ]);
    mockPrisma.campaign.upsert.mockResolvedValue({ id: 'campaign-db' });
    mockPrisma.adGroup.findMany.mockResolvedValue([
      { id: 'adset-db', facebookAdSetId: 'adset_1' },
    ]);
    mockPrisma.adGroup.upsert.mockResolvedValue({ id: 'adset-db' });
    mockPrisma.creative.upsert.mockResolvedValue({ id: 'creative-db' });
  });

  it('syncAll persists campaigns, ad sets, and ads with updated timestamps', async () => {
    const service = new FacebookSyncServiceClass('token', 'act_1', 'db_1');

    const result = await service.syncAll();

    expect(result.success).toBe(true);
    expect(result.campaigns).toBe(1);
    expect(result.adSets).toBe(1);
    expect(result.ads).toBe(1);

    expect(mockPrisma.campaign.upsert).toHaveBeenCalledTimes(1);
    const campaignArgs = mockPrisma.campaign.upsert.mock.calls[0][0];
    expect(campaignArgs.create.lastSyncedAt).toBeInstanceOf(Date);

    expect(mockPrisma.adGroup.upsert).toHaveBeenCalledTimes(1);
    const adGroupArgs = mockPrisma.adGroup.upsert.mock.calls[0][0];
    expect(adGroupArgs.create.lastSyncedAt).toBeInstanceOf(Date);

    expect(mockPrisma.creative.upsert).toHaveBeenCalledTimes(1);
    const creativeArgs = mockPrisma.creative.upsert.mock.calls[0][0];
    expect(creativeArgs.create.lastSyncedAt).toBeInstanceOf(Date);

    const finalUpdateCall = mockPrisma.adAccount.update.mock.calls.at(-1);
    expect(finalUpdateCall).toBeTruthy();
    expect(finalUpdateCall?.[0].data.lastSyncedAt).toBeInstanceOf(Date);
    expect(finalUpdateCall?.[0].data.syncStatus).toBe('IDLE');
  });
});
