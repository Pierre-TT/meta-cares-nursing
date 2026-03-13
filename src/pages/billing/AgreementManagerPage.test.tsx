import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AgreementManagerPage } from './AgreementManagerPage';

const useEAgreementRequestsMock = vi.fn();

vi.mock('@/hooks/useEAgreementData', () => ({
  useEAgreementRequests: () => useEAgreementRequestsMock(),
}));

describe('AgreementManagerPage', () => {
  beforeEach(() => {
    useEAgreementRequestsMock.mockReturnValue({
      data: [
        {
          id: 'req-1',
          patientId: 'patient-1',
          patient: {
            id: 'patient-1',
            fullName: 'Marie Devos',
            niss: '52.01.15-123.45',
            mutuality: 'Mutualite Chretienne',
            prescribingDoctor: 'Dr. Janssens',
          },
          careType: 'Forfait B',
          nomenclature: '425072',
          katzCategory: 'B',
          prescriberName: 'Dr. Janssens',
          startAt: '2025-01-01',
          endAt: '2025-12-31',
          status: 'approved',
          mycarenetReference: 'EA-2026-001',
          requiredAttachments: [],
          supportingContext: {},
          submittedAt: '2025-12-01T09:00:00.000Z',
          decidedAt: '2025-12-05T10:30:00.000Z',
          createdAt: '2025-11-30T08:00:00.000Z',
          updatedAt: '2025-12-05T10:30:00.000Z',
          createdBy: {
            id: 'profile-1',
            fullName: 'Marie Billing',
            role: 'billing_office',
          },
          reviewedBy: {
            id: 'profile-2',
            fullName: 'Admin System',
            role: 'admin',
          },
          hadEpisodeReference: 'HAD-2026-002',
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  it('prepares a renewal and opens the history modal', () => {
    render(<AgreementManagerPage />);

    fireEvent.click(screen.getByText('Marie Devos'));
    fireEvent.click(screen.getByRole('button', { name: /Preparer le renouvellement/i }));
    fireEvent.click(screen.getByRole('button', { name: /Historique/i }));

    expect(screen.getByRole('status')).toHaveTextContent('Renouvellement prepare pour Marie Devos.');
    expect(screen.getByText('Historique Marie Devos')).toBeInTheDocument();
  }, 10000);
});
