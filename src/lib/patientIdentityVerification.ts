import { queueDataAccessLog } from '@/lib/dataAccess';

export type PatientIdentityMethod = 'eid_chip' | 'isi_plus_chip' | 'barcode' | 'manual_niss';
export type PatientIdentityAssurance = 'high' | 'fallback';

export interface PatientIdentityVerificationRecord {
  patientRouteId: string;
  patientDatabaseId?: string;
  patientLabel: string;
  nationalNumber: string;
  verifiedAt: string;
  method: PatientIdentityMethod;
  assurance: PatientIdentityAssurance;
  supportNumber: string;
  reason?: string;
}

const identityStorageKey = 'meta-cares:patient-identity-verifications';

function readRecords() {
  if (typeof window === 'undefined') {
    return [] as PatientIdentityVerificationRecord[];
  }

  try {
    const raw = window.localStorage.getItem(identityStorageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is PatientIdentityVerificationRecord => Boolean(entry && typeof entry === 'object'))
      : [];
  } catch {
    return [];
  }
}

function writeRecords(records: PatientIdentityVerificationRecord[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(identityStorageKey, JSON.stringify(records.slice(0, 50)));
}

export function savePatientIdentityVerification(record: PatientIdentityVerificationRecord) {
  const records = readRecords().filter((entry) => entry.patientRouteId !== record.patientRouteId);
  records.unshift(record);
  writeRecords(records);

  if (record.patientDatabaseId) {
    queueDataAccessLog({
      tableName: 'patient_identity_verifications',
      action: 'sync',
      patientId: record.patientDatabaseId,
      resourceLabel: 'Verification identite patient',
      severity: record.assurance === 'high' ? 'low' : 'medium',
      containsPii: true,
      metadata: {
        patientRouteId: record.patientRouteId,
        patientLabel: record.patientLabel,
        nationalNumber: record.nationalNumber,
        verifiedAt: record.verifiedAt,
        method: record.method,
        assurance: record.assurance,
        supportNumber: record.supportNumber,
        reason: record.reason ?? null,
      },
    });
  }

  return record;
}

export function getLatestPatientIdentityVerification(patientRouteId: string) {
  return readRecords().find((entry) => entry.patientRouteId === patientRouteId) ?? null;
}
