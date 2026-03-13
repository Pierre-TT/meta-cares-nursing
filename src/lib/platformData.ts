import type { Tables } from '@/lib/database.types';
import type { Patient } from '@/lib/patients';

type DashboardSectionRow = Pick<Tables<'dashboard_sections'>, 'section_key' | 'payload'>;

const emptyPatientProfile: Patient = {
  id: '',
  niss: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: 'X',
  phone: '',
  email: undefined,
  address: {
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    lat: undefined,
    lng: undefined,
  },
  mutuality: '',
  mutualityNumber: '',
  katzCategory: undefined,
  katzScore: undefined,
  prescribingDoctor: '',
  doctorPhone: undefined,
  allergies: [],
  pathologies: [],
  notes: undefined,
  isActive: false,
  lastVisit: undefined,
  nextVisit: undefined,
  photoUrl: undefined,
  createdAt: '',
};

export const emptyPlatformSnapshot = {
  admin: {
    summary: {
      userCount: 0,
      alertCount: 0,
      certificateDeadlines: 0,
      uptime: 0,
      complianceScore: 0,
      mfaCoverage: 0,
      backupReadiness: 0,
      pendingDsars: 0,
      activeIncidentCount: 0,
    },
    contact: {
      name: '',
      role: '',
      status: '',
    },
    certificateBanner: {
      title: '',
      detail: '',
    },
    serviceHealth: [] as {
      name: string;
      status: 'ok' | 'warning';
      uptime: string;
      latency: string;
    }[],
    riskQueues: [] as {
      title: string;
      count: number;
      severity: 'amber' | 'blue' | 'green' | 'outline' | 'red';
      detail: string;
    }[],
    recentActivity: [] as {
      user: string;
      role: string;
      action: string;
      time: string;
    }[],
    recoveryHighlights: [] as {
      label: string;
      value: string;
      tone: 'amber' | 'blue' | 'green';
    }[],
    audit: {
      auditLog: [] as {
        id: string;
        time: string;
        date: string;
        user: string;
        action: string;
        resource: string;
        ip: string;
        severity: 'high' | 'low' | 'medium';
        pii: boolean;
        system: boolean;
      }[],
      suspiciousActivityNote: '',
    },
    rgpd: {
      complianceChecks: [] as {
        id: string;
        label: string;
        description: string;
        status: 'ok' | 'warning';
        lastCheck: string;
      }[],
      requests: [] as {
        id: string;
        type: 'access' | 'portability' | 'rectification';
        patient: string;
        date: string;
        deadline: string;
        status: 'completed' | 'pending';
      }[],
      registerCompletion: 0,
      requestsHandled: 0,
      dpiaToReview: 0,
      nextTrainingInDays: 0,
      slaNotice: '',
      governanceHighlights: [] as {
        title: string;
        detail: string;
        tone: 'amber' | 'blue' | 'green';
      }[],
    },
    security: {
      privilegedAccounts: [] as {
        name: string;
        scope: string;
        lastElevation: string;
        mfa: 'review' | 'strong' | 'vault';
        risk: 'high' | 'low' | 'medium';
      }[],
      riskySessions: [] as {
        user: string;
        context: string;
        signal: string;
        score: string;
        severity: 'high' | 'medium';
      }[],
      trustedDevices: [] as {
        label: string;
        owner: string;
        state: 'blocked' | 'review' | 'trusted';
        lastSeen: string;
      }[],
      authMix: [] as {
        method: string;
        adoption: string;
        posture: string;
      }[],
      breakGlassNotice: '',
    },
    certificates: {
      inventory: [] as {
        name: string;
        environment: string;
        expires: string;
        owner: string;
        usage: string;
        status: 'expiring' | 'ok' | 'warning';
      }[],
      trustChecks: [] as {
        label: string;
        state: 'ok' | 'warning';
        detail: string;
      }[],
      approvals: [] as {
        surface: string;
        status: 'approved' | 'review';
        detail: string;
      }[],
      renewalNotice: '',
    },
    dataGovernance: {
      processingRegister: [] as {
        activity: string;
        lawfulBasis: string;
        owner: string;
        completeness: string;
        status: 'ok' | 'warning';
      }[],
      dsarQueue: [] as {
        id: string;
        type: 'access' | 'portability' | 'rectification';
        patient: string;
        date: string;
        deadline: string;
        status: 'completed' | 'pending';
      }[],
      processors: [] as {
        name: string;
        region: string;
        dpa: string;
        scope: string;
      }[],
      retentionControls: [] as {
        label: string;
        value: string;
        tone: 'amber' | 'green' | 'red';
      }[],
      article30Notice: '',
    },
    consents: {
      patientConsents: [] as {
        patient: string;
        consent: 'active' | 'missing' | 'renewal';
        therapeuticLink: 'blocked' | 'ok' | 'review';
        exclusion: string;
        lastSync: string;
      }[],
      syncGaps: [] as {
        label: string;
        detail: string;
        severity: 'amber' | 'green' | 'red';
      }[],
      accessAudit: [] as {
        label: string;
        value: string;
        tone: 'amber' | 'blue' | 'green';
      }[],
      syncNotice: '',
    },
    incidents: {
      active: [] as {
        title: string;
        severity: 'high' | 'medium';
        opened: string;
        owner: string;
        deadline: string;
        apd: boolean;
        status: 'containment' | 'investigation';
      }[],
      workflow: [] as {
        step: string;
        detail: string;
        state: 'active' | 'done' | 'pending';
      }[],
      exercises: [] as {
        name: string;
        date: string;
        result: string;
        status: 'ok' | 'warning';
      }[],
      documentation: [] as {
        title: string;
        detail: string;
        tone: 'amber' | 'blue';
      }[],
      governanceNotice: '',
    },
    backup: {
      snapshots: [] as {
        workload: string;
        lastSnapshot: string;
        retention: string;
        status: 'ok' | 'warning';
      }[],
      recoveryObjectives: [] as {
        system: string;
        rpo: string;
        rto: string;
        readiness: 'ok' | 'review';
      }[],
      restoreDrills: [] as {
        scenario: string;
        date: string;
        result: string;
        status: 'ok' | 'warning';
      }[],
      preparedness: [] as {
        title: string;
        detail: string;
        tone: 'blue' | 'green';
      }[],
      lagNotice: '',
    },
    settings: {
      connectors: [] as {
        name: string;
        state: 'active' | 'review' | 'sandbox';
        detail: string;
      }[],
      maintenanceWindows: [] as {
        title: string;
        schedule: string;
        impact: string;
      }[],
      settingsHighlights: [] as {
        title: string;
        detail: string;
        tone: 'amber' | 'blue' | 'green';
      }[],
      statusCards: [] as {
        label: string;
        detail: string;
        tone: 'amber' | 'blue' | 'green' | 'red';
      }[],
      featureFlagsCount: 0,
      toggleDefaults: {
        autoFreeze: false,
        maintenanceBanner: false,
        betaFlags: false,
      },
    },
  },
  coordinator: {
    teamMembers: [] as {
      name: string;
      visits: number;
      completed: number;
      revenue: number;
      status: 'active' | 'done' | 'off';
      currentPatient?: string;
      zone: string;
    }[],
    alerts: [] as {
      id: string;
      message: string;
      nurse: string;
      time: string;
      type: 'billing' | 'delay' | 'vital';
    }[],
    activityFeed: [] as {
      id: string;
      nurse: string;
      action: string;
      patient: string;
      time: string;
      icon: 'activity' | 'alert' | 'check' | 'send';
      color: string;
    }[],
    aiInsights: [] as {
      text: string;
      priority: 'high' | 'low' | 'medium';
    }[],
  },
  billing: {
    kpis: {
      dailyInvoices: 0,
      pendingAmount: 0,
      acceptanceRate: 0,
      rejections: 0,
      avgProcessingMin: 0,
      monthlyRevenue: 0,
      prevMonthRevenue: 1,
    },
    revenueTrend: [] as {
      month: string;
      value: number;
    }[],
    recentActivity: [] as {
      id: string;
      action: string;
      detail: string;
      time: string;
      icon: 'alert' | 'check' | 'euro' | 'send';
      color: string;
    }[],
    mutuelleStatus: [] as {
      name: string;
      status: 'degraded' | 'online';
    }[],
  },
  patient: {
    linkedPatientId: null as string | null,
    profile: emptyPatientProfile,
    nurseETA: {
      name: '',
      eta: 0,
      status: 'preparing' as 'en_route' | 'preparing',
      visits: 0,
    },
    medReminders: [] as {
      id: string;
      name: string;
      time: string;
      status: 'due' | 'taken' | 'upcoming';
    }[],
    timeline: [] as {
      id: string;
      time: string;
      label: string;
      status: 'current' | 'done' | 'upcoming';
    }[],
    vitals: [] as {
      label: string;
      value: string;
      unit: string;
      tone: 'amber' | 'blue' | 'green' | 'red';
    }[],
    healthTip: '',
  },
};

export type PlatformSnapshot = typeof emptyPlatformSnapshot;
export type AdminPlatformData = PlatformSnapshot['admin'];
export type CoordinatorDashboardData = PlatformSnapshot['coordinator'];
export type BillingDashboardData = PlatformSnapshot['billing'];
export type PatientHomeData = PlatformSnapshot['patient'];

function getSection<T>(rows: DashboardSectionRow[], sectionKey: string, fallback: T): T {
  const row = rows.find((item) => item.section_key === sectionKey);
  return (row?.payload as T | undefined) ?? fallback;
}

export function mapAdminPlatformData(rows: DashboardSectionRow[]): AdminPlatformData {
  return {
    summary: getSection(rows, 'summary', emptyPlatformSnapshot.admin.summary),
    contact: getSection(rows, 'contact', emptyPlatformSnapshot.admin.contact),
    certificateBanner: getSection(rows, 'certificateBanner', emptyPlatformSnapshot.admin.certificateBanner),
    serviceHealth: getSection(rows, 'serviceHealth', emptyPlatformSnapshot.admin.serviceHealth),
    riskQueues: getSection(rows, 'riskQueues', emptyPlatformSnapshot.admin.riskQueues),
    recentActivity: getSection(rows, 'recentActivity', emptyPlatformSnapshot.admin.recentActivity),
    recoveryHighlights: getSection(rows, 'recoveryHighlights', emptyPlatformSnapshot.admin.recoveryHighlights),
    audit: getSection(rows, 'audit', emptyPlatformSnapshot.admin.audit),
    rgpd: getSection(rows, 'rgpd', emptyPlatformSnapshot.admin.rgpd),
    security: getSection(rows, 'security', emptyPlatformSnapshot.admin.security),
    certificates: getSection(rows, 'certificates', emptyPlatformSnapshot.admin.certificates),
    dataGovernance: getSection(rows, 'dataGovernance', emptyPlatformSnapshot.admin.dataGovernance),
    consents: getSection(rows, 'consents', emptyPlatformSnapshot.admin.consents),
    incidents: getSection(rows, 'incidents', emptyPlatformSnapshot.admin.incidents),
    backup: getSection(rows, 'backup', emptyPlatformSnapshot.admin.backup),
    settings: getSection(rows, 'settings', emptyPlatformSnapshot.admin.settings),
  };
}

export function mapCoordinatorDashboardData(rows: DashboardSectionRow[]): CoordinatorDashboardData {
  return {
    teamMembers: getSection(rows, 'teamMembers', emptyPlatformSnapshot.coordinator.teamMembers),
    alerts: getSection(rows, 'alerts', emptyPlatformSnapshot.coordinator.alerts),
    activityFeed: getSection(rows, 'activityFeed', emptyPlatformSnapshot.coordinator.activityFeed),
    aiInsights: getSection(rows, 'aiInsights', emptyPlatformSnapshot.coordinator.aiInsights),
  };
}

export function mapBillingDashboardData(rows: DashboardSectionRow[]): BillingDashboardData {
  return {
    kpis: getSection(rows, 'kpis', emptyPlatformSnapshot.billing.kpis),
    revenueTrend: getSection(rows, 'revenueTrend', emptyPlatformSnapshot.billing.revenueTrend),
    recentActivity: getSection(rows, 'recentActivity', emptyPlatformSnapshot.billing.recentActivity),
    mutuelleStatus: getSection(rows, 'mutuelleStatus', emptyPlatformSnapshot.billing.mutuelleStatus),
  };
}

export function mapPatientRecordToProfile(
  patient: Tables<'patients'>,
  allergies: string[],
  pathologies: string[]
): Patient {
  return {
    id: patient.id,
    niss: patient.niss ?? '',
    firstName: patient.first_name,
    lastName: patient.last_name,
    dateOfBirth: patient.date_of_birth ?? '',
    gender: patient.gender ?? 'X',
    phone: patient.phone,
    email: patient.email ?? undefined,
    address: {
      street: patient.street,
      houseNumber: patient.house_number,
      postalCode: patient.postal_code,
      city: patient.city,
      lat: patient.lat ?? undefined,
      lng: patient.lng ?? undefined,
    },
    mutuality: patient.mutuality,
    mutualityNumber: patient.mutuality_number,
    katzCategory: patient.katz_category ?? undefined,
    katzScore: patient.katz_score ?? undefined,
    prescribingDoctor: patient.prescribing_doctor,
    doctorPhone: patient.doctor_phone ?? undefined,
    allergies,
    pathologies,
    notes: patient.notes ?? undefined,
    isActive: patient.is_active,
    lastVisit: patient.last_visit_at ?? undefined,
    nextVisit: patient.next_visit_at ?? undefined,
    photoUrl: patient.photo_url ?? undefined,
    createdAt: patient.created_at,
  };
}

export function formatTimeValue(value: string | null | undefined) {
  return value ? value.slice(0, 5) : '';
}
