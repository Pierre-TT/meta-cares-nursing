import { describe, expect, it } from 'vitest';
import { deriveBillingAutopilotSnapshot } from '@/lib/billingAutopilot';
import type { EAgreementRequest } from '@/lib/eagreements';

function createSummary(overrides: Partial<Parameters<typeof deriveBillingAutopilotSnapshot>[0][number]> = {}) {
  return {
    visit_id: 'visit-1',
    place_of_service: 'A',
    total_billable_minutes: 52,
    hourly_amount: 74.6,
    estimated_forfait_amount: 61.3,
    delta_amount: 13.3,
    requires_manual_review: false,
    review_reasons: [],
    status: 'validated',
    validated_at: '2026-03-08T09:00:00.000Z',
    generated_at: '2026-03-08T08:45:00.000Z',
    visit: {
      id: 'visit-1',
      patient_id: 'patient-1',
      scheduled_start: '2026-03-08T07:30:00.000Z',
      patient: {
        id: 'patient-1',
        first_name: 'Marie',
        last_name: 'Dubois',
        mutuality: 'MC 200',
      },
      nurse: {
        first_name: 'Sophie',
        last_name: 'Dupuis',
      },
    },
    ...overrides,
  };
}

function createAgreement(overrides: Partial<EAgreementRequest> = {}): EAgreementRequest {
  return {
    id: 'agreement-1',
    patientId: 'patient-1',
    patient: {
      id: 'patient-1',
      fullName: 'Marie Dubois',
      niss: '12345678901',
      mutuality: 'MC 200',
      prescribingDoctor: 'Dr Martin',
    },
    careType: 'Forfait B',
    nomenclature: '425110',
    prescriberName: 'Dr Martin',
    startAt: '2026-01-01',
    endAt: '2026-12-31',
    status: 'approved',
    requiredAttachments: [],
    supportingContext: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('deriveBillingAutopilotSnapshot', () => {
  it('classifies validated summaries as ready when no blocker is present', () => {
    const snapshot = deriveBillingAutopilotSnapshot(
      [createSummary()],
      [createAgreement()],
    );

    expect(snapshot.readyCount).toBe(1);
    expect(snapshot.items[0]?.lane).toBe('ready');
    expect(snapshot.automationRate).toBe(100);
  });

  it('prioritizes manual review cases over ready items', () => {
    const snapshot = deriveBillingAutopilotSnapshot(
      [
        createSummary({
          visit_id: 'visit-review',
          requires_manual_review: true,
          status: 'review',
          review_reasons: ['Segments incoherents'],
        }),
        createSummary({
          visit_id: 'visit-ready',
          visit: {
            id: 'visit-ready',
            patient_id: 'patient-2',
            scheduled_start: '2026-03-08T07:30:00.000Z',
            patient: {
              id: 'patient-2',
              first_name: 'Luc',
              last_name: 'Martin',
              mutuality: 'MC 100',
            },
            nurse: {
              first_name: 'Thomas',
              last_name: 'Maes',
            },
          },
        }),
      ],
      [
        createAgreement(),
        createAgreement({
          id: 'agreement-2',
          patientId: 'patient-2',
          patient: {
            id: 'patient-2',
            fullName: 'Luc Martin',
            niss: '12345678902',
            mutuality: 'MC 100',
            prescribingDoctor: 'Dr Simon',
          },
        }),
      ],
    );

    expect(snapshot.reviewCount).toBe(1);
    expect(snapshot.items[0]?.id).toBe('visit-review');
    expect(snapshot.items[0]?.lane).toBe('review');
  });

  it('routes rejected agreements into recovery', () => {
    const snapshot = deriveBillingAutopilotSnapshot(
      [createSummary()],
      [
        createAgreement({
          status: 'rejected',
          rejectionReason: 'Attestation manquante',
        }),
      ],
    );

    expect(snapshot.recoveryCount).toBe(1);
    expect(snapshot.items[0]?.lane).toBe('recovery');
    expect(snapshot.items[0]?.actionPath).toBe('/billing/agreements');
  });
});
