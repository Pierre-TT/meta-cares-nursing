import { describe, expect, it } from 'vitest';
import { buildSmartVisitBriefing, type BuildSmartVisitBriefingInput } from '@/lib/smartVisitBriefing';

function createBaseInput(): BuildSmartVisitBriefingInput {
  return {
    patient: {
      id: 'patient-route-1',
      niss: '50.03.22-567.89',
      firstName: 'Pierre',
      lastName: 'Janssen',
      dateOfBirth: '1950-03-22',
      gender: 'M',
      phone: '+32 475 98 76 54',
      address: {
        street: 'Avenue Louise',
        houseNumber: '45',
        postalCode: '1050',
        city: 'Ixelles',
      },
      mutuality: 'Solidaris',
      mutualityNumber: '206-9876543-21',
      katzCategory: 'C',
      katzScore: 35,
      prescribingDoctor: 'Dr. Lejeune',
      doctorPhone: '+32 2 123 45 67',
      allergies: ['Penicilline', 'Latex'],
      pathologies: ['Diabete', 'Ulcere jambe gauche'],
      isActive: true,
      lastVisit: '2026-03-05T08:00:00Z',
      nextVisit: '2026-03-09T09:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
    },
    visitHistory: [
      {
        id: 'visit-latest',
        patientId: 'patient-db-1',
        scheduledStart: '2026-03-08T08:00:00Z',
        completedAt: '2026-03-08T08:35:00Z',
        status: 'completed',
        notes: 'Glycemie haute, douleur plus importante, surveillance demandee.',
        acts: [
          { code: '425611', label: 'Pansement complexe', valueW: 5.143, category: 'wound' },
          { code: '425456', label: 'Admin. medicaments', valueW: 2.571, category: 'medication' },
        ],
        vitals: {
          glycemia: 210,
          bloodPressureSystolic: 165,
          bloodPressureDiastolic: 92,
          oxygenSaturation: 93,
          pain: 7,
        },
        totalW: 7.714,
      },
      {
        id: 'visit-previous',
        patientId: 'patient-db-1',
        scheduledStart: '2026-03-06T08:00:00Z',
        completedAt: '2026-03-06T08:30:00Z',
        status: 'completed',
        notes: 'Etat stable.',
        signature: 'signed',
        acts: [
          { code: '425596', label: 'Pansement simple', valueW: 3.086, category: 'wound' },
        ],
        vitals: {
          glycemia: 150,
          bloodPressureSystolic: 138,
          bloodPressureDiastolic: 80,
          oxygenSaturation: 96,
          pain: 3,
        },
        totalW: 3.086,
      },
    ],
    woundAssessments: [
      {
        id: 'wound-latest',
        patientId: 'patient-db-1',
        woundLabel: 'Jambe gauche',
        woundType: 'ulcere',
        zoneId: 'leg-l',
        lengthCm: 4,
        widthCm: 3,
        depthCm: 0.5,
        exudateLevel: 'moderate',
        tissueType: 'granulation',
        pain: 6,
        metadata: {},
        recordedAt: '2026-03-08T08:20:00Z',
      },
      {
        id: 'wound-previous',
        patientId: 'patient-db-1',
        woundLabel: 'Jambe gauche',
        woundType: 'ulcere',
        zoneId: 'leg-l',
        lengthCm: 3,
        widthCm: 2,
        depthCm: 0.5,
        exudateLevel: 'mild',
        tissueType: 'granulation',
        pain: 4,
        metadata: {},
        recordedAt: '2026-03-05T08:20:00Z',
      },
    ],
    activeEpisode: {
      id: 'had-1',
      reference: 'HAD-001',
      episodeType: 'opat',
      status: 'active',
      origin: 'hospital',
      riskLevel: 'high',
      diagnosisSummary: 'Ulcere infecte avec suivi glycemique',
      admissionReason: 'Post-hospitalisation',
      hospital: { name: 'CHU' },
      patient: {
        id: 'patient-db-1',
        fullName: 'Pierre Janssen',
        city: 'Ixelles',
        mutuality: 'Solidaris',
      },
    },
    hadEpisodeDetail: {
      episode: {
        id: 'had-1',
        reference: 'HAD-001',
        episodeType: 'opat',
        status: 'active',
        origin: 'hospital',
        riskLevel: 'high',
        diagnosisSummary: 'Ulcere infecte avec suivi glycemique',
        admissionReason: 'Post-hospitalisation',
        hospital: { name: 'CHU' },
        patient: {
          id: 'patient-db-1',
          fullName: 'Pierre Janssen',
          city: 'Ixelles',
          mutuality: 'Solidaris',
        },
        consentConfirmed: true,
        homeReady: true,
        caregiverRequired: false,
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-08T09:00:00Z',
      },
      patient: {
        id: 'patient-db-1',
        fullName: 'Pierre Janssen',
        city: 'Ixelles',
        mutuality: 'Solidaris',
        phone: '+32 475 98 76 54',
        address: {
          street: 'Avenue Louise',
          houseNumber: '45',
          postalCode: '1050',
          city: 'Ixelles',
        },
        prescribingDoctor: 'Dr. Lejeune',
      },
      teamMembers: [],
      carePlans: [
        {
          id: 'cp-1',
          version: 1,
          status: 'active',
          protocolSlug: 'wound-care',
          summary: 'Pansement complexe et surveillance glycemique quotidienne.',
          monitoringPlan: {},
          escalationRules: {},
          dischargeCriteria: {},
          reviewFrequencyHours: 24,
          createdAt: '2026-03-01T00:00:00Z',
        },
      ],
      medicationOrders: [
        {
          id: 'med-1',
          lineNumber: 1,
          medicationName: 'Insuline rapide',
          dose: '8 UI',
          route: 'SC',
          frequency: 'Avant repas',
          requiresNurse: true,
          supplier: 'Pharmacie locale',
          status: 'active',
          nextDueAt: '2026-03-09T08:30:00Z',
        },
      ],
      alerts: [
        {
          id: 'alert-1',
          severity: 'high',
          status: 'open',
          title: 'Plaie a surveiller',
          description: 'Augmentation de la surface et douleur en hausse.',
          createdAt: '2026-03-08T09:00:00Z',
        },
      ],
      tasks: [
        {
          id: 'task-1',
          episodeId: 'had-1',
          ownerKind: 'team',
          visibility: 'team',
          status: 'todo',
          taskType: 'coordination',
          title: 'Verifier materiel de pansement',
          createdAt: '2026-03-08T10:00:00Z',
          updatedAt: '2026-03-08T10:00:00Z',
        },
      ],
      logisticsItems: [],
      visits: [],
    } as BuildSmartVisitBriefingInput['hadEpisodeDetail'],
    consent: {
      patientId: 'patient-db-1',
      consentStatus: 'renewal',
      therapeuticLinkStatus: 'review',
      exclusionNote: 'Pas d acces hors suivi infirmier.',
      lastSyncAt: '2026-03-08T07:00:00Z',
      source: 'patient_consents',
    },
    agreementRequests: [
      {
        id: 'agreement-1',
        patientId: 'patient-db-1',
        patient: {
          id: 'patient-db-1',
          fullName: 'Pierre Janssen',
          niss: '50.03.22-567.89',
          mutuality: 'Solidaris',
          prescribingDoctor: 'Dr. Lejeune',
        },
        careType: 'Soins de plaies',
        nomenclature: 'Art. 8',
        prescriberName: 'Dr. Lejeune',
        startAt: '2026-01-01',
        endAt: '2026-03-05',
        status: 'approved',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-03-06T00:00:00Z',
        requiredAttachments: [],
        supportingContext: {},
      },
    ],
    medicationReminders: [
      {
        id: 'rem-1',
        name: 'Metformine',
        scheduledFor: '2026-03-09T08:00:00Z',
        status: 'due',
      },
    ],
    timelineEvents: [
      {
        id: 'timeline-1',
        label: 'Famille signale une baisse d appetit.',
        eventTime: '2026-03-08T18:00:00Z',
        status: 'current',
      },
    ],
  };
}

describe('buildSmartVisitBriefing', () => {
  it('surfaces clinical risk, blockers, and changes in one briefing', () => {
    const briefing = buildSmartVisitBriefing(createBaseInput());

    expect(briefing.readiness.tone).toBe('red');
    expect(briefing.riskItems.some((item) => item.title.includes('Glycémie'))).toBe(true);
    expect(briefing.riskItems.some((item) => item.title.includes('Episode HAD'))).toBe(true);
    expect(briefing.adminBlockers.some((item) => item.title.includes('Consentement'))).toBe(true);
    expect(briefing.adminBlockers.some((item) => item.title.includes('eAgreement expiré'))).toBe(true);
    expect(briefing.changes.some((item) => item.title.includes('Glycémie modifiée'))).toBe(true);
    expect(briefing.changes.some((item) => item.title.includes('Evolution de plaie'))).toBe(true);
    expect(briefing.medications[0]?.title).toBe('Metformine');
  });

  it('returns a ready status when the file is clinically quiet and administratively clean', () => {
    const input = createBaseInput();
    input.patient.allergies = [];
    input.visitHistory = [
      {
        id: 'visit-only',
        patientId: 'patient-db-1',
        scheduledStart: '2026-03-08T08:00:00Z',
        completedAt: '2026-03-08T08:25:00Z',
        status: 'completed',
        notes: 'Passage stable, aucun changement notable.',
        signature: 'signed',
        acts: [{ code: '425132', label: 'Toilette partielle', valueW: 2.571, category: 'toilette' }],
        vitals: {
          glycemia: 118,
          bloodPressureSystolic: 128,
          bloodPressureDiastolic: 78,
          oxygenSaturation: 97,
          pain: 1,
        },
        totalW: 2.571,
      },
    ];
    input.woundAssessments = [];
    input.activeEpisode = null;
    input.hadEpisodeDetail = null;
    input.consent = {
      patientId: 'patient-db-1',
      consentStatus: 'active',
      therapeuticLinkStatus: 'ok',
      exclusionNote: '',
      lastSyncAt: '2026-03-08T07:00:00Z',
      source: 'patient_consents',
    };
    input.agreementRequests = [];
    input.medicationReminders = [
      {
        id: 'rem-1',
        name: 'Paracetamol',
        scheduledFor: '2026-03-09T10:00:00Z',
        status: 'upcoming',
      },
    ];
    input.timelineEvents = [];

    const briefing = buildSmartVisitBriefing(input);

    expect(briefing.readiness.tone).toBe('green');
    expect(briefing.adminBlockers).toHaveLength(0);
    expect(briefing.riskItems).toHaveLength(0);
    expect(briefing.medications).toHaveLength(1);
    expect(briefing.recentNotes[0]?.signed).toBe(true);
  });
});
