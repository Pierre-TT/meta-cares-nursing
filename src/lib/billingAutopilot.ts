import type { Json, Tables } from '@/lib/database.types';
import {
  getDaysUntilEAgreementEnd,
  getEAgreementPresentationStatus,
  listEAgreementRequests,
  type EAgreementRequest,
} from '@/lib/eagreements';
import { queueDataAccessLog } from '@/lib/dataAccess';
import { supabase } from '@/lib/supabase';

type BillingAutopilotSummaryRow = Pick<
  Tables<'visit_hourly_billing_summaries'>,
  | 'visit_id'
  | 'place_of_service'
  | 'total_billable_minutes'
  | 'hourly_amount'
  | 'estimated_forfait_amount'
  | 'delta_amount'
  | 'requires_manual_review'
  | 'review_reasons'
  | 'status'
  | 'validated_at'
  | 'generated_at'
> & {
  visit:
    | (Pick<Tables<'visits'>, 'id' | 'patient_id' | 'scheduled_start'> & {
        patient: Pick<Tables<'patients'>, 'id' | 'first_name' | 'last_name' | 'mutuality'> | null;
        nurse: Pick<Tables<'profiles'>, 'first_name' | 'last_name'> | null;
      })
    | null;
};

export type BillingAutopilotLane = 'ready' | 'blocked' | 'review' | 'recovery';

export interface BillingAutopilotItem {
  id: string;
  lane: BillingAutopilotLane;
  title: string;
  patientLabel: string;
  nurseLabel: string;
  mutualityLabel: string;
  amount: number;
  generatedAt: string;
  detail: string;
  urgency: 'low' | 'medium' | 'high';
  actionLabel: string;
  actionPath: string;
  tags: string[];
}

export interface BillingAutopilotSnapshot {
  items: BillingAutopilotItem[];
  totalCases: number;
  readyCount: number;
  blockedCount: number;
  reviewCount: number;
  recoveryCount: number;
  readyAmount: number;
  atRiskAmount: number;
  automationRate: number;
  note: string;
}

const summarySelect = `
  visit_id,
  place_of_service,
  total_billable_minutes,
  hourly_amount,
  estimated_forfait_amount,
  delta_amount,
  requires_manual_review,
  review_reasons,
  status,
  validated_at,
  generated_at,
  visit:visits!visit_hourly_billing_summaries_visit_id_fkey (
    id,
    patient_id,
    scheduled_start,
    patient:patients!visits_patient_id_fkey (
      id,
      first_name,
      last_name,
      mutuality
    ),
    nurse:profiles!visits_nurse_id_fkey (
      first_name,
      last_name
    )
  )
`;

function isMissingSchemaArtifact(error: { code?: string | null } | null | undefined) {
  return error?.code === '42P01' || error?.code === 'PGRST200' || error?.code === 'PGRST205';
}

function toRounded(value: number) {
  return Number(value.toFixed(2));
}

function toStringArray(value: Json | null | undefined) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : [];
}

function toFullName(profile?: Pick<Tables<'profiles'>, 'first_name' | 'last_name'> | null) {
  const fullName = `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim();
  return fullName.length > 0 ? fullName : 'Equipe non attribuee';
}

function toPatientName(patient?: Pick<Tables<'patients'>, 'first_name' | 'last_name'> | null) {
  const fullName = `${patient?.first_name ?? ''} ${patient?.last_name ?? ''}`.trim();
  return fullName.length > 0 ? fullName : 'Patient non resolu';
}

function getLatestRequestByPatientId(requests: EAgreementRequest[]) {
  const latestByPatientId = new Map<string, EAgreementRequest>();

  for (const request of requests) {
    if (!latestByPatientId.has(request.patientId)) {
      latestByPatientId.set(request.patientId, request);
    }
  }

  return latestByPatientId;
}

function toUrgency(
  lane: BillingAutopilotLane,
  amount: number,
  daysUntilAgreementEnd?: number,
) {
  if (lane === 'review' || lane === 'recovery') {
    return amount >= 90 ? 'high' : 'medium';
  }

  if (lane === 'blocked') {
    if (typeof daysUntilAgreementEnd === 'number' && daysUntilAgreementEnd <= 7) {
      return 'high';
    }

    return amount >= 110 ? 'high' : 'medium';
  }

  return amount >= 75 ? 'medium' : 'low';
}

function compareItems(left: BillingAutopilotItem, right: BillingAutopilotItem) {
  const laneOrder: Record<BillingAutopilotLane, number> = {
    review: 0,
    recovery: 1,
    blocked: 2,
    ready: 3,
  };
  const urgencyOrder: Record<BillingAutopilotItem['urgency'], number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return (
    laneOrder[left.lane] - laneOrder[right.lane] ||
    urgencyOrder[left.urgency] - urgencyOrder[right.urgency] ||
    right.amount - left.amount ||
    new Date(right.generatedAt).getTime() - new Date(left.generatedAt).getTime()
  );
}

export function deriveBillingAutopilotSnapshot(
  summaries: BillingAutopilotSummaryRow[],
  requests: EAgreementRequest[],
): BillingAutopilotSnapshot {
  const latestRequestByPatientId = getLatestRequestByPatientId(requests);

  const items = summaries
    .flatMap((row) => {
      if (!row.visit?.patient_id) {
        return [];
      }

      const patientId = row.visit.patient_id;
      const latestRequest = latestRequestByPatientId.get(patientId);
      const patientLabel = toPatientName(row.visit.patient);
      const nurseLabel = toFullName(row.visit.nurse);
      const mutualityLabel = row.visit.patient?.mutuality?.trim() || 'Mutuelle a confirmer';
      const agreementStatus = latestRequest
        ? getEAgreementPresentationStatus(latestRequest)
        : null;
      const daysUntilAgreementEnd = latestRequest
        ? getDaysUntilEAgreementEnd(latestRequest)
        : undefined;
      const reviewReasons = toStringArray(row.review_reasons);
      const amount = toRounded(row.hourly_amount);
      const tags = [
        `${Math.round(row.total_billable_minutes)} min`,
        `Place ${row.place_of_service}`,
      ];

      if (latestRequest?.mycarenetReference) {
        tags.push(latestRequest.mycarenetReference);
      }

      if (row.delta_amount !== 0) {
        tags.push(
          `${row.delta_amount >= 0 ? '+' : ''}EUR${toRounded(row.delta_amount).toFixed(0)} vs forfait`,
        );
      }

      let lane: BillingAutopilotLane = 'ready';
      let title = row.validated_at ? 'Pret pour export eFact' : 'Pret pour validation';
      let detail = row.validated_at
        ? 'Controle horaire deja valide. L autopilote recommande l inclusion au prochain lot.'
        : 'Controle horaire conforme. Validation possible sans reprise manuelle.';
      let actionLabel = row.validated_at ? 'Ouvrir la file' : 'Valider';
      let actionPath = '/billing/queue';

      if (row.requires_manual_review || row.status === 'review') {
        lane = 'review';
        title = 'Relecture horaire requise';
        detail = reviewReasons[0] ?? 'Verifier les segments horaires avant validation.';
        actionLabel = 'Traiter la relecture';
      } else if (!row.visit.patient?.mutuality?.trim()) {
        lane = 'blocked';
        title = 'Mutuelle a confirmer';
        detail = 'Le routage mutuelle est incomplet. La prestation ne doit pas partir en lot sans correction.';
        actionLabel = 'Completer le dossier';
        actionPath = '/billing/patient-account';
      } else if (agreementStatus === 'rejected' || agreementStatus === 'cancelled') {
        lane = 'recovery';
        title = 'Accord MyCareNet a relancer';
        detail = latestRequest?.rejectionReason
          ?? 'Dernier accord rejete. Corriger puis relancer avant export.';
        actionLabel = 'Relancer l accord';
        actionPath = '/billing/agreements';
      } else if (agreementStatus === 'expiring' || agreementStatus === 'expired') {
        lane = 'blocked';
        title = agreementStatus === 'expired' ? 'Accord expire' : 'Accord a renouveler';
        detail = latestRequest
          ? `L accord ${latestRequest.nomenclature} couvre encore ${Math.max(daysUntilAgreementEnd ?? 0, 0)} jour(s).`
          : 'Accord a renouveler avant le prochain lot.';
        actionLabel = 'Preparer le renouvellement';
        actionPath = '/billing/agreements';
      } else if (agreementStatus === 'pending' || agreementStatus === 'draft') {
        lane = 'blocked';
        title = agreementStatus === 'pending' ? 'Accord en attente' : 'Accord brouillon';
        detail = 'L accord MyCareNet n est pas encore stabilise. Attendre ou finaliser avant export.';
        actionLabel = 'Ouvrir les accords';
        actionPath = '/billing/agreements';
      }

      return [{
        id: row.visit_id,
        lane,
        title,
        patientLabel,
        nurseLabel,
        mutualityLabel,
        amount,
        generatedAt: row.generated_at ?? row.visit.scheduled_start,
        detail,
        urgency: toUrgency(lane, amount, daysUntilAgreementEnd),
        actionLabel,
        actionPath,
        tags,
      } satisfies BillingAutopilotItem];
    })
    .sort(compareItems);

  const readyCount = items.filter((item) => item.lane === 'ready').length;
  const blockedCount = items.filter((item) => item.lane === 'blocked').length;
  const reviewCount = items.filter((item) => item.lane === 'review').length;
  const recoveryCount = items.filter((item) => item.lane === 'recovery').length;
  const readyAmount = toRounded(
    items
      .filter((item) => item.lane === 'ready')
      .reduce((sum, item) => sum + item.amount, 0),
  );
  const atRiskAmount = toRounded(
    items
      .filter((item) => item.lane !== 'ready')
      .reduce((sum, item) => sum + item.amount, 0),
  );
  const automationRate = items.length > 0
    ? Math.round((readyCount / items.length) * 100)
    : 0;

  let note = 'Aucun dossier horaire disponible pour l autopilote.';
  if (items.length > 0) {
    if (reviewCount > 0) {
      note = `${reviewCount} dossier(s) doivent etre relus avant tout export.`;
    } else if (blockedCount > 0 || recoveryCount > 0) {
      note = `${blockedCount + recoveryCount} dossier(s) sont bloques par des prerequis MyCareNet ou administratifs.`;
    } else {
      note = 'Le portefeuille recent est aligné pour validation et envoi.';
    }
  }

  return {
    items: items.slice(0, 6),
    totalCases: items.length,
    readyCount,
    blockedCount,
    reviewCount,
    recoveryCount,
    readyAmount,
    atRiskAmount,
    automationRate,
    note,
  };
}

function createEmptyBillingAutopilotSnapshot(): BillingAutopilotSnapshot {
  return {
    items: [],
    totalCases: 0,
    readyCount: 0,
    blockedCount: 0,
    reviewCount: 0,
    recoveryCount: 0,
    readyAmount: 0,
    atRiskAmount: 0,
    automationRate: 0,
    note: 'Aucun dossier horaire disponible pour l autopilote.',
  };
}

export async function getBillingAutopilotSnapshot(): Promise<BillingAutopilotSnapshot> {
  const [{ data, error }, requests] = await Promise.all([
    supabase
      .from('visit_hourly_billing_summaries')
      .select(summarySelect)
      .order('generated_at', { ascending: false })
      .limit(60),
    listEAgreementRequests({ limit: 80 }),
  ]);

  if (error) {
    if (isMissingSchemaArtifact(error)) {
      return createEmptyBillingAutopilotSnapshot();
    }

    throw error;
  }

  const rows = (data ?? []) as BillingAutopilotSummaryRow[];

  queueDataAccessLog({
    tableName: 'visit_hourly_billing_summaries',
    action: 'read',
    resourceLabel: 'Autopilote de facturation',
    containsPii: true,
    severity: 'low',
    metadata: {
      scope: 'billing-autopilot',
      summaryCount: rows.length,
      agreementCount: requests.length,
    },
  });

  return deriveBillingAutopilotSnapshot(rows, requests);
}
