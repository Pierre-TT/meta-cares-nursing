import { useQuery } from '@tanstack/react-query';
import type { Database } from '@/lib/database.types';
import { queueDataAccessLog } from '@/lib/dataAccess';
import {
  emptyPlatformSnapshot,
  formatTimeValue,
  mapAdminPlatformData,
  mapBillingDashboardData,
  mapCoordinatorDashboardData,
  mapPatientRecordToProfile,
  type PlatformSnapshot,
} from '@/lib/platformData';
import { supabase } from '@/lib/supabase';
import { useAuthStore, type User } from '@/stores/authStore';

type DashboardScope = Database['public']['Enums']['dashboard_scope'];

const platformDataQueryKey = ['platform-data'] as const;

async function fetchDashboardSections(scope: DashboardScope) {
  const { data, error } = await supabase
    .from('dashboard_sections')
    .select('section_key, payload')
    .eq('scope', scope);

  if (error) {
    throw error;
  }

  return data ?? [];
}

function normalizeMedicationStatus(
  status: string
): PlatformSnapshot['patient']['medReminders'][number]['status'] {
  switch (status) {
    case 'taken':
    case 'upcoming':
      return status;
    default:
      return 'due';
  }
}

function normalizeTimelineStatus(
  status: string
): PlatformSnapshot['patient']['timeline'][number]['status'] {
  switch (status) {
    case 'done':
    case 'current':
      return status;
    default:
      return 'upcoming';
  }
}

function normalizeVitalTone(
  tone: string
): PlatformSnapshot['patient']['vitals'][number]['tone'] {
  switch (tone) {
    case 'red':
    case 'amber':
    case 'green':
      return tone;
    default:
      return 'blue';
  }
}

function normalizeEtaStatus(
  status: string | null | undefined
): PlatformSnapshot['patient']['nurseETA']['status'] {
  return status === 'preparing' ? 'preparing' : 'en_route';
}

function createFallbackPatientHome(user: User): PlatformSnapshot['patient'] {
  return {
    ...emptyPlatformSnapshot.patient,
    profile: {
      ...emptyPlatformSnapshot.patient.profile,
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    nurseETA: {
      ...emptyPlatformSnapshot.patient.nurseETA,
      name: 'Équipe Meta Cares',
    },
    healthTip: 'Votre équipe soignante actualisera prochainement vos rappels et conseils.',
  };
}

async function loadPatientHome(user: User): Promise<PlatformSnapshot['patient']> {
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (patientError) {
    throw patientError;
  }

  if (!patient) {
    return createFallbackPatientHome(user);
  }

  const [
    allergiesResult,
    pathologiesResult,
    dashboardStateResult,
    remindersResult,
    timelineResult,
    vitalsResult,
  ] = await Promise.all([
    supabase
      .from('patient_allergies')
      .select('label')
      .eq('patient_id', patient.id)
      .order('label', { ascending: true }),
    supabase
      .from('patient_pathologies')
      .select('label')
      .eq('patient_id', patient.id)
      .order('label', { ascending: true }),
    supabase
      .from('patient_dashboard_state')
      .select('nurse_name, eta_minutes, eta_status, visits_today, health_tip')
      .eq('patient_id', patient.id)
      .maybeSingle(),
    supabase
      .from('medication_reminders')
      .select('id, name, scheduled_for, status')
      .eq('patient_id', patient.id)
      .order('display_order', { ascending: true }),
    supabase
      .from('patient_timeline_events')
      .select('id, event_time, label, status')
      .eq('patient_id', patient.id)
      .order('display_order', { ascending: true }),
    supabase
      .from('patient_vital_snapshots')
      .select('label, value, unit, tone')
      .eq('patient_id', patient.id)
      .order('display_order', { ascending: true }),
  ]);

  if (allergiesResult.error) {
    throw allergiesResult.error;
  }

  if (pathologiesResult.error) {
    throw pathologiesResult.error;
  }

  if (dashboardStateResult.error) {
    throw dashboardStateResult.error;
  }

  if (remindersResult.error) {
    throw remindersResult.error;
  }

  if (timelineResult.error) {
    throw timelineResult.error;
  }

  if (vitalsResult.error) {
    throw vitalsResult.error;
  }

  queueDataAccessLog({
    tableName: 'patients',
    action: 'read',
    recordId: patient.id,
    patientId: patient.id,
    resourceLabel: 'Chargement du portail patient',
    containsPii: true,
    severity: 'low',
    metadata: {
      scope: 'patient-home',
      profileId: user.id,
    },
  });

  return {
    profile: mapPatientRecordToProfile(
      patient,
      (allergiesResult.data ?? []).map((row) => row.label),
      (pathologiesResult.data ?? []).map((row) => row.label)
    ),
    nurseETA: {
      name: dashboardStateResult.data?.nurse_name || 'Équipe Meta Cares',
      eta: dashboardStateResult.data?.eta_minutes ?? 0,
      status: normalizeEtaStatus(dashboardStateResult.data?.eta_status),
      visits: dashboardStateResult.data?.visits_today ?? 0,
    },
    medReminders: (remindersResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      time: formatTimeValue(row.scheduled_for),
      status: normalizeMedicationStatus(row.status),
    })),
    timeline: (timelineResult.data ?? []).map((row) => ({
      id: row.id,
      time: formatTimeValue(row.event_time),
      label: row.label,
      status: normalizeTimelineStatus(row.status),
    })),
    vitals: (vitalsResult.data ?? []).map((row) => ({
      label: row.label,
      value: row.value,
      unit: row.unit,
      tone: normalizeVitalTone(row.tone),
    })),
    healthTip:
      dashboardStateResult.data?.health_tip ||
      'Votre équipe soignante actualisera prochainement vos rappels et conseils.',
  };
}

export function usePlatformData() {
  const user = useAuthStore((s) => s.user);

  return useQuery<PlatformSnapshot>({
    queryKey: [...platformDataQueryKey, user?.id ?? 'guest', user?.role ?? 'guest'],
    enabled: Boolean(user),
    initialData:
      user?.role === 'patient'
        ? { ...emptyPlatformSnapshot, patient: createFallbackPatientHome(user) }
        : emptyPlatformSnapshot,
    initialDataUpdatedAt: 0,
    queryFn: async () => {
      if (!user) {
        return emptyPlatformSnapshot;
      }

      switch (user.role) {
        case 'admin':
          return {
            ...emptyPlatformSnapshot,
            admin: mapAdminPlatformData(await fetchDashboardSections('admin')),
          };
        case 'coordinator':
          return {
            ...emptyPlatformSnapshot,
            coordinator: mapCoordinatorDashboardData(await fetchDashboardSections('coordinator')),
          };
        case 'billing_office':
          return {
            ...emptyPlatformSnapshot,
            billing: mapBillingDashboardData(await fetchDashboardSections('billing')),
          };
        case 'patient':
          return {
            ...emptyPlatformSnapshot,
            patient: await loadPatientHome(user),
          };
        default:
          return emptyPlatformSnapshot;
      }
    },
  });
}

export function useAdminPlatformData() {
  const query = usePlatformData();
  return { ...query, data: query.data.admin } as const;
}

export function useCoordinatorDashboardData() {
  const query = usePlatformData();
  return { ...query, data: query.data.coordinator } as const;
}

export function useBillingDashboardData() {
  const query = usePlatformData();
  return { ...query, data: query.data.billing } as const;
}

export function usePatientHomeData() {
  const query = usePlatformData();
  return { ...query, data: query.data.patient } as const;
}
