import { describe, expect, it } from 'vitest';
import {
  getBatchCompliance,
  getBatchSendBlockers,
  getPatientBillingCompliance,
  getQueueCompliance,
  getQueueComplianceBlockers,
  getQueueComplianceWarnings,
} from '@/lib/inamiBillingCompliance';

describe('inamiBillingCompliance', () => {
  it('keeps compliant draft batches sendable', () => {
    const draftCompliance = getBatchCompliance('2');

    expect(getBatchSendBlockers(draftCompliance)).toEqual([]);
  });

  it('flags blocked queue items with identity and archive prerequisites', () => {
    const queueCompliance = getQueueCompliance('q9');

    expect(getQueueComplianceBlockers(queueCompliance)).toEqual(
      expect.arrayContaining([
        'Aucune preuve d identite rattachee',
        'Notification palliative absente',
        'Prescription non archivee',
      ]),
    );
  });

  it('tracks patient justificatif delivery status for monthly reporting', () => {
    const patientCompliance = getPatientBillingCompliance('P002');

    expect(patientCompliance.patientJustificatif.channel).toBe('papier');
    expect(patientCompliance.patientJustificatif.dueDate).toBe('2026-03-29');
  });

  it('keeps warning-only queue items validatable', () => {
    const queueCompliance = getQueueCompliance('q2');

    expect(getQueueComplianceBlockers(queueCompliance)).toEqual([]);
    expect(getQueueComplianceWarnings(queueCompliance)).toContain('MemberData a reverifier avant cloture mensuelle');
  });
});
