import { useQuery } from '@tanstack/react-query';
import { queueDataAccessLog } from '@/lib/dataAccess';
import { mapPatientRecordToProfile } from '@/lib/platformData';
import { mockPatients, type Patient } from '@/lib/patients';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

export type NursePatient = Patient & {
  databaseId: string;
  routeId: string;
};

const nursePatientsQueryKey = ['nurse-patients'] as const;

const mockRouteIdByNiss = new Map(
  mockPatients
    .filter((patient) => patient.niss)
    .map((patient) => [patient.niss, patient.id] as const),
);

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function toRouteId(patient: Tables<'patients'>) {
  return (patient.niss && mockRouteIdByNiss.get(patient.niss)) || patient.id;
}

function toNursePatient(
  patient: Tables<'patients'>,
  allergies: string[],
  pathologies: string[],
): NursePatient {
  const routeId = toRouteId(patient);
  const profile = mapPatientRecordToProfile(patient, allergies, pathologies);

  return {
    ...profile,
    id: routeId,
    routeId,
    databaseId: patient.id,
  };
}

async function fetchPatientRelations(patientIds: string[]) {
  if (patientIds.length === 0) {
    return {
      allergiesByPatientId: new Map<string, string[]>(),
      pathologiesByPatientId: new Map<string, string[]>(),
    };
  }

  const [allergiesResult, pathologiesResult] = await Promise.all([
    supabase
      .from('patient_allergies')
      .select('patient_id, label')
      .in('patient_id', patientIds)
      .order('label', { ascending: true }),
    supabase
      .from('patient_pathologies')
      .select('patient_id, label')
      .in('patient_id', patientIds)
      .order('label', { ascending: true }),
  ]);

  if (allergiesResult.error) {
    throw allergiesResult.error;
  }

  if (pathologiesResult.error) {
    throw pathologiesResult.error;
  }

  const allergiesByPatientId = new Map<string, string[]>();
  const pathologiesByPatientId = new Map<string, string[]>();

  for (const row of allergiesResult.data ?? []) {
    const existing = allergiesByPatientId.get(row.patient_id) ?? [];
    existing.push(row.label);
    allergiesByPatientId.set(row.patient_id, existing);
  }

  for (const row of pathologiesResult.data ?? []) {
    const existing = pathologiesByPatientId.get(row.patient_id) ?? [];
    existing.push(row.label);
    pathologiesByPatientId.set(row.patient_id, existing);
  }

  return { allergiesByPatientId, pathologiesByPatientId };
}

async function fetchNursePatients(): Promise<NursePatient[]> {
  const { data: patients, error } = await supabase
    .from('patients')
    .select('*')
    .eq('is_active', true)
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });

  if (error) {
    throw error;
  }

  const patientRows = patients ?? [];
  const { allergiesByPatientId, pathologiesByPatientId } = await fetchPatientRelations(
    patientRows.map((patient) => patient.id),
  );

  queueDataAccessLog({
    tableName: 'patients',
    action: 'read',
    resourceLabel: 'Liste des patients actifs',
    containsPii: true,
    severity: 'low',
    metadata: {
      scope: 'nurse-patient-list',
      patientCount: patientRows.length,
    },
  });

  return patientRows.map((patient) =>
    toNursePatient(
      patient,
      allergiesByPatientId.get(patient.id) ?? [],
      pathologiesByPatientId.get(patient.id) ?? [],
    ),
  );
}

async function fetchNursePatient(routePatientId: string): Promise<NursePatient | null> {
  const mockPatient = mockPatients.find((patient) => patient.id === routePatientId);

  let patientRow: Tables<'patients'> | null = null;

  if (isUuid(routePatientId)) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', routePatientId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    patientRow = data;
  } else if (mockPatient?.niss) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('niss', mockPatient.niss)
      .maybeSingle();

    if (error) {
      throw error;
    }

    patientRow = data;
  }

  if (!patientRow) {
    return null;
  }

  const { allergiesByPatientId, pathologiesByPatientId } = await fetchPatientRelations([patientRow.id]);

  queueDataAccessLog({
    tableName: 'patients',
    action: 'read',
    recordId: patientRow.id,
    patientId: patientRow.id,
    resourceLabel: 'Consultation d’un dossier patient',
    containsPii: true,
    severity: 'low',
    metadata: {
      scope: 'nurse-patient-detail',
      routePatientId,
    },
  });

  return toNursePatient(
    patientRow,
    allergiesByPatientId.get(patientRow.id) ?? [],
    pathologiesByPatientId.get(patientRow.id) ?? [],
  );
}

export function useNursePatients() {
  return useQuery({
    queryKey: nursePatientsQueryKey,
    queryFn: fetchNursePatients,
  });
}

export function useNursePatient(patientId?: string) {
  return useQuery({
    queryKey: [...nursePatientsQueryKey, patientId ?? 'unknown'],
    enabled: Boolean(patientId),
    queryFn: async () => fetchNursePatient(patientId!),
  });
}
