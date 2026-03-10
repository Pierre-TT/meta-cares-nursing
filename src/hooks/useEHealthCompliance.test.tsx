import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

const { mockGetAdminEHealthComplianceSnapshot } = vi.hoisted(() => ({
  mockGetAdminEHealthComplianceSnapshot: vi.fn(),
}));

vi.mock('@/lib/eHealthCompliance', () => ({
  emptyAdminEHealthComplianceSnapshot: {
    summary: {
      userCount: 0,
      alertCount: 0,
      complianceScore: 0,
    },
    recentActivity: [],
    audit: {
      auditLog: [],
      suspiciousActivityNote: 'empty',
    },
    consents: {
      patientConsents: [],
      syncGaps: [],
      accessAudit: [],
      syncNotice: 'empty',
    },
    complianceHighlights: [],
    complianceNotice: 'empty',
  },
  getAdminEHealthComplianceSnapshot: mockGetAdminEHealthComplianceSnapshot,
}));

import { useAdminEHealthCompliance } from './useEHealthCompliance';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useAdminEHealthCompliance', () => {
  it('fetches live admin eHealth data on first mount even with placeholder data', async () => {
    mockGetAdminEHealthComplianceSnapshot.mockResolvedValue({
      summary: {
        userCount: 2,
        alertCount: 1,
        complianceScore: 84,
      },
      recentActivity: [],
      audit: {
        auditLog: [],
        suspiciousActivityNote: 'ok',
      },
      consents: {
        patientConsents: [
          {
            patientId: 'patient-1',
            patient: 'Dubois Marie',
            consent: 'renewal',
            therapeuticLink: 'review',
            exclusion: 'Aucune exclusion',
            lastSync: '09/03/2026 08:45',
          },
        ],
        syncGaps: [],
        accessAudit: [],
        syncNotice: 'sync active',
      },
      complianceHighlights: [],
      complianceNotice: 'ok',
    });

    const { result } = renderHook(() => useAdminEHealthCompliance(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data.consents.patientConsents).toHaveLength(0);

    await waitFor(() => {
      expect(result.current.data.consents.patientConsents).toHaveLength(1);
    });

    expect(result.current.data.consents.patientConsents[0]?.patient).toBe('Dubois Marie');
    expect(mockGetAdminEHealthComplianceSnapshot).toHaveBeenCalledTimes(1);
  });
});
