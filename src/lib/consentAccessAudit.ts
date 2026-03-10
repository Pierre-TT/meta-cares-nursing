import type { Tables } from '@/lib/database.types';
import { queueDataAccessLog } from '@/lib/dataAccess';
import { supabase } from '@/lib/supabase';

type AccessLogRow = Pick<
  Tables<'data_access_logs'>,
  | 'id'
  | 'action'
  | 'table_name'
  | 'patient_id'
  | 'resource_label'
  | 'severity'
  | 'contains_pii'
  | 'system_generated'
  | 'created_at'
> & {
  actor: Pick<Tables<'profiles'>, 'first_name' | 'last_name' | 'role' | 'email'> | null;
  patient: Pick<Tables<'patients'>, 'first_name' | 'last_name'> | null;
};

export interface ConsentAccessAuditEvent {
  id: string;
  patientId: string | null;
  patientName: string;
  actorLabel: string;
  actorRole: string;
  actionLabel: string;
  resourceLabel: string;
  severity: 'low' | 'medium' | 'high';
  containsPii: boolean;
  systemGenerated: boolean;
  createdAt: string;
}

export interface ConsentAccessAuditSnapshot {
  visibility: 'available' | 'restricted' | 'unavailable';
  events: ConsentAccessAuditEvent[];
}

function isMissingSchemaArtifact(error: { code?: string | null } | null | undefined) {
  return error?.code === '42P01' || error?.code === 'PGRST205';
}

function isRestrictedRead(error: { code?: string | null; message?: string | null } | null | undefined) {
  return error?.code === '42501' || error?.message?.toLowerCase().includes('permission denied');
}

function toFullName(
  actor?: Pick<Tables<'profiles'>, 'first_name' | 'last_name' | 'email'> | null,
) {
  const fullName = `${actor?.first_name ?? ''} ${actor?.last_name ?? ''}`.trim();

  if (fullName.length > 0) {
    return fullName;
  }

  return actor?.email ?? 'Utilisateur inconnu';
}

function toPatientName(patient?: Pick<Tables<'patients'>, 'first_name' | 'last_name'> | null) {
  const fullName = `${patient?.first_name ?? ''} ${patient?.last_name ?? ''}`.trim();
  return fullName.length > 0 ? fullName : 'Patient non resolu';
}

function toRoleLabel(role?: Tables<'profiles'>['role'] | null, systemGenerated?: boolean) {
  if (systemGenerated) {
    return 'Systeme';
  }

  switch (role) {
    case 'admin':
      return 'Admin';
    case 'billing_office':
      return 'Facturation';
    case 'coordinator':
      return 'Coordinateur';
    case 'nurse':
      return 'Infirmier';
    case 'patient':
      return 'Patient';
    default:
      return 'Utilisateur';
  }
}

function toActionLabel(action: string) {
  switch (action) {
    case 'delete':
      return 'DELETE';
    case 'insert':
      return 'CREATE';
    case 'update':
      return 'UPDATE';
    case 'sync':
      return 'SYNC';
    default:
      return 'VIEW';
  }
}

export async function getConsentAccessAudit(patientId?: string): Promise<ConsentAccessAuditSnapshot> {
  let query = supabase
    .from('data_access_logs')
    .select(`
      id,
      action,
      table_name,
      patient_id,
      resource_label,
      severity,
      contains_pii,
      system_generated,
      created_at,
      actor:profiles!data_access_logs_actor_id_fkey (
        first_name,
        last_name,
        role,
        email
      ),
      patient:patients!data_access_logs_patient_id_fkey (
        first_name,
        last_name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(40);

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingSchemaArtifact(error)) {
      return {
        visibility: 'unavailable',
        events: [],
      };
    }

    if (isRestrictedRead(error)) {
      return {
        visibility: 'restricted',
        events: [],
      };
    }

    throw error;
  }

  const rows = (data ?? []) as AccessLogRow[];

  queueDataAccessLog({
    tableName: 'data_access_logs',
    action: 'read',
    patientId: patientId ?? null,
    resourceLabel: patientId
      ? 'Cockpit patient des acces eHealth'
      : 'Cockpit global des acces eHealth',
    containsPii: false,
    severity: 'low',
    metadata: {
      patientScoped: Boolean(patientId),
      count: rows.length,
    },
  });

  return {
    visibility: 'available',
    events: rows.map((row) => ({
      id: row.id,
      patientId: row.patient_id,
      patientName: toPatientName(row.patient),
      actorLabel: toFullName(row.actor),
      actorRole: toRoleLabel(row.actor?.role, row.system_generated),
      actionLabel: toActionLabel(row.action),
      resourceLabel: row.resource_label || row.table_name,
      severity: row.severity as ConsentAccessAuditEvent['severity'],
      containsPii: row.contains_pii,
      systemGenerated: row.system_generated,
      createdAt: row.created_at,
    })),
  };
}
