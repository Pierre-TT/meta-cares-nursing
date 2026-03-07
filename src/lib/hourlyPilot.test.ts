import { describe, expect, it } from 'vitest';
import { buildHourlyPilotVisitComputation } from '@/lib/hourlyPilot';

describe('buildHourlyPilotVisitComputation', () => {
  it('génère des lignes directes et indirectes en mode manuel', () => {
    const result = buildHourlyPilotVisitComputation({
      visitStartAt: '2026-03-02T08:00:00.000Z',
      visitEndAt: '2026-03-02T08:30:00.000Z',
      placeOfService: 'A',
      geofencingEnabled: false,
      careTransitions: [
        { recordedAt: '2026-03-02T08:00:00.000Z', careMode: 'direct', source: 'system' },
        { recordedAt: '2026-03-02T08:20:00.000Z', careMode: 'indirect', source: 'manual' },
      ],
      estimatedForfaitAmount: 30,
    });

    expect(result.summary.totalDirectMinutes).toBe(20);
    expect(result.summary.totalIndirectMinutes).toBe(10);
    expect(result.summary.totalTravelMinutes).toBe(0);
    expect(result.lines.map((line) => line.code)).toEqual(['423835', '423872']);
  });

  it('déduit travel/direct/indirect depuis le geofencing au domicile', () => {
    const result = buildHourlyPilotVisitComputation({
      visitStartAt: '2026-03-02T08:00:00.000Z',
      visitEndAt: '2026-03-02T08:45:00.000Z',
      placeOfService: 'A',
      geofencingEnabled: true,
      patientLatitude: 50,
      patientLongitude: 4,
      locationEvents: [
        { recordedAt: '2026-03-02T08:00:00.000Z', latitude: 50.002, longitude: 4.002, source: 'device' },
        { recordedAt: '2026-03-02T08:10:00.000Z', latitude: 50, longitude: 4, source: 'device' },
        { recordedAt: '2026-03-02T08:35:00.000Z', latitude: 50.002, longitude: 4.002, source: 'device' },
      ],
      careTransitions: [
        { recordedAt: '2026-03-02T08:25:00.000Z', careMode: 'indirect', source: 'manual' },
      ],
      estimatedForfaitAmount: 40,
    });

    expect(result.summary.totalTravelMinutes).toBe(20);
    expect(result.summary.totalDirectMinutes).toBe(15);
    expect(result.summary.totalIndirectMinutes).toBe(10);
    expect(result.lines.map((line) => line.code)).toEqual(['421396', '423835', '423872', '421396']);
  });

  it('bascule sur les pseudocodes week-end', () => {
    const result = buildHourlyPilotVisitComputation({
      visitStartAt: '2026-03-07T09:00:00.000Z',
      visitEndAt: '2026-03-07T10:00:00.000Z',
      placeOfService: 'A',
      geofencingEnabled: false,
      estimatedForfaitAmount: 20,
    });

    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].code).toBe('423850');
    expect(result.summary.hourlyAmount).toBe(59.1);
  });

  it('demande une revue si le geofencing est activé sans coordonnées patient', () => {
    const result = buildHourlyPilotVisitComputation({
      visitStartAt: '2026-03-03T09:00:00.000Z',
      visitEndAt: '2026-03-03T09:30:00.000Z',
      placeOfService: 'A',
      geofencingEnabled: true,
      estimatedForfaitAmount: 25,
    });

    expect(result.summary.requiresManualReview).toBe(true);
    expect(result.summary.reviewReasons).toContain('Coordonnées patient manquantes: geofencing impossible.');
  });
});
