import type { Json } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type DataAccessAction = 'read' | 'insert' | 'update' | 'delete' | 'sync';
export type DataAccessSeverity = 'low' | 'medium' | 'high';

export interface LogDataAccessInput {
  tableName: string;
  action?: DataAccessAction;
  recordId?: string | null;
  patientId?: string | null;
  ipHint?: string | null;
  resourceLabel?: string | null;
  severity?: DataAccessSeverity;
  containsPii?: boolean;
  systemGenerated?: boolean;
  metadata?: Json;
}

type JsonObject = { [key: string]: Json | undefined };

function isJsonObject(value: Json | undefined): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function buildMetadata(metadata?: Json): Json {
  const base: JsonObject = isJsonObject(metadata) ? metadata : {};

  return {
    ...base,
    client:
      typeof window !== 'undefined'
        ? {
            surface: 'web',
            pathname: window.location.pathname,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          }
        : { surface: 'server' },
  };
}

export async function logDataAccess(input: LogDataAccessInput) {
  if (!input.tableName.trim()) {
    return null;
  }

  const { data, error } = await supabase.rpc('log_data_access', {
    p_table_name: input.tableName,
    p_action: input.action ?? 'read',
    p_record_id: input.recordId ?? null,
    p_patient_id: input.patientId ?? null,
    p_ip_hint: input.ipHint ?? null,
    p_resource_label: input.resourceLabel ?? null,
    p_severity: input.severity ?? 'low',
    p_contains_pii: input.containsPii ?? true,
    p_system_generated: input.systemGenerated ?? false,
    p_metadata: buildMetadata(input.metadata),
  });

  if (error) {
    if (import.meta.env.DEV) {
      console.warn('Unable to write data access log.', error);
    }

    return null;
  }

  return data ?? null;
}

export function queueDataAccessLog(input: LogDataAccessInput) {
  void logDataAccess(input);
}
