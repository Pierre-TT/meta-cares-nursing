import type { HadEpisodeTask } from '@/lib/had';

export const hadSuggestionTrackingPrefix = 'MC_SUGGESTION_REF:';

export type HadSuggestionProgressState = 'draft' | 'pending' | 'validated';

function toSuggestionTimestamp(value?: string) {
  return value ? new Date(value).getTime() : 0;
}

export function slugifyHadSuggestionPart(value?: string) {
  const normalized = (value ?? 'none')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'none';
}

export function buildHadSuggestionTrackingCode(...parts: Array<string | undefined>) {
  return parts.map((part) => slugifyHadSuggestionPart(part)).join(':');
}

export function appendHadSuggestionTracking(description: string | undefined, trackingCode?: string) {
  if (!trackingCode) {
    return description?.trim() || undefined;
  }

  const referenceLine = `${hadSuggestionTrackingPrefix}${trackingCode}`;
  const trimmed = description?.trim();

  if (trimmed?.includes(referenceLine)) {
    return trimmed;
  }

  return [trimmed, referenceLine].filter(Boolean).join('\n\n');
}

export function extractHadSuggestionTrackingCode(description?: string) {
  if (!description) {
    return undefined;
  }

  return description
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith(hadSuggestionTrackingPrefix))
    ?.slice(hadSuggestionTrackingPrefix.length)
    .trim();
}

export function getHadSuggestionSourceLabel(trackingCode?: string) {
  switch (trackingCode?.split(':')[0]) {
    case 'caseload':
      return 'Charge Patients';
    case 'team':
      return 'Gestion Équipe';
    default:
      return 'Suggestion HAD';
  }
}

export function getHadSuggestionKindLabel(trackingCode?: string) {
  switch (trackingCode?.split(':')[1]) {
    case 'assign':
      return 'Affectation';
    case 'rebalance':
      return 'Rééquilibrage';
    case 'backup':
      return 'Renfort';
    default:
      return 'Suggestion';
  }
}

export function getHadSuggestionOwnerLabel(task: Pick<HadEpisodeTask, 'ownerKind' | 'ownerExternalLabel'>) {
  if (task.ownerExternalLabel) {
    return task.ownerExternalLabel;
  }

  switch (task.ownerKind) {
    case 'coordinator':
      return 'Coordination';
    case 'nurse':
      return 'Infirmier';
    case 'patient':
      return 'Patient';
    case 'logistics':
      return 'Logistique';
    case 'gp':
      return 'Médecin traitant';
    case 'caregiver':
      return 'Aidant';
    case 'system':
      return 'Système';
    default:
      return 'Intervenant externe';
  }
}

export function getHadSuggestionTaskActivityAt(
  task: Pick<HadEpisodeTask, 'completedAt' | 'updatedAt' | 'createdAt'>
) {
  return task.completedAt ?? task.updatedAt ?? task.createdAt;
}

export function listHadSuggestionTasks(tasks: HadEpisodeTask[], trackingCode?: string) {
  const normalizedTrackingCode = trackingCode?.trim();

  return tasks
    .filter((task) => {
      const taskTrackingCode = extractHadSuggestionTrackingCode(task.description);

      return normalizedTrackingCode ? taskTrackingCode === normalizedTrackingCode : Boolean(taskTrackingCode);
    })
    .sort((left, right) => {
      const activityDiff =
        toSuggestionTimestamp(getHadSuggestionTaskActivityAt(right)) -
        toSuggestionTimestamp(getHadSuggestionTaskActivityAt(left));

      if (activityDiff !== 0) {
        return activityDiff;
      }

      return toSuggestionTimestamp(right.createdAt) - toSuggestionTimestamp(left.createdAt);
    });
}

export function findHadSuggestionTask(tasks: HadEpisodeTask[], trackingCode: string) {
  return listHadSuggestionTasks(tasks, trackingCode)[0];
}

export function getHadSuggestionProgressState(task?: Pick<HadEpisodeTask, 'status'> | null): HadSuggestionProgressState {
  if (!task) {
    return 'draft';
  }

  return task.status === 'done' ? 'validated' : 'pending';
}
