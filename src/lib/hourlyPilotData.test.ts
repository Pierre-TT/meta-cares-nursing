import { describe, expect, it, vi, beforeEach } from 'vitest';

const { mockFrom, mockQueueDataAccessLog } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockQueueDataAccessLog: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

vi.mock('@/lib/dataAccess', () => ({
  queueDataAccessLog: mockQueueDataAccessLog,
}));

import { hourlyPilotCatalog } from '@/lib/hourlyPilot';
import { getHourlyPilotAdminOverview } from './hourlyPilotData';

function createMissingSchemaResponse() {
  return { data: null, error: { code: 'PGRST205' } };
}

describe('getHourlyPilotAdminOverview', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockQueueDataAccessLog.mockReset();
  });

  it('returns a non-breaking fallback when pilot tables are missing from the schema', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'visit_hourly_billing_summaries') {
        return {
          select: vi.fn(() => ({
            order: vi.fn().mockResolvedValue(createMissingSchemaResponse()),
          })),
        };
      }

      if (table === 'visit_hourly_billing_lines') {
        return {
          select: vi.fn().mockResolvedValue(createMissingSchemaResponse()),
        };
      }

      throw new Error(`Unexpected table query: ${table}`);
    });

    const result = await getHourlyPilotAdminOverview();

    expect(result).toEqual({
      schemaAvailable: false,
      totalVisits: 0,
      totalBillableHours: 0,
      hourlyAmount: 0,
      forfaitAmount: 0,
      deltaAmount: 0,
      readyRate: 0,
      reviewCount: 0,
      avgGeofencingCoverage: undefined,
      activePseudocodeCount: 0,
      placeBreakdown: [],
      catalog: hourlyPilotCatalog,
    });
    expect(mockQueueDataAccessLog).not.toHaveBeenCalled();
  });
});
