import { createNurseWoundAssessment, type CreateNurseWoundAssessmentInput } from '@/lib/nurseClinical';
import { isBelraiDraftPendingSync, listStoredBelraiDrafts } from '@/lib/belrai';

const woundQueueStorageKey = 'mc-offline-wound-assessments';
const offlineClinicalQueueEvent = 'mc-offline-clinical-queue';
const offlineClinicalSnapshotCache = new Map<string, {
  signature: string;
  snapshot: OfflineClinicalQueueSnapshot;
}>();

export interface OfflineWoundQueueEntry {
  localId: string;
  patientId: string;
  patientLabel: string;
  woundLabel: string;
  zoneId: string;
  recordedAt: string;
  retryCount: number;
  lastError?: string;
  payload: CreateNurseWoundAssessmentInput;
}

export interface OfflineBelraiQueueEntry {
  patientId: string;
  updatedAt: string;
  status: string;
  syncStatus: string;
}

export interface OfflineClinicalQueueSnapshot {
  online: boolean;
  woundEntries: OfflineWoundQueueEntry[];
  belraiEntries: OfflineBelraiQueueEntry[];
  pendingCount: number;
}

export interface OfflineWoundFlushResult {
  syncedCount: number;
  failedCount: number;
  remainingCount: number;
}

function readWoundQueue() {
  if (typeof localStorage === 'undefined') {
    return [] as OfflineWoundQueueEntry[];
  }

  const raw = localStorage.getItem(woundQueueStorageKey);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as OfflineWoundQueueEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeWoundQueue(entries: OfflineWoundQueueEntry[]) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(woundQueueStorageKey, JSON.stringify(entries));
  emitOfflineClinicalQueueChange();
}

export function emitOfflineClinicalQueueChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(offlineClinicalQueueEvent));
  }
}

function createLocalId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `offline-${Date.now()}`;
}

export function listOfflineWoundQueue(patientId?: string) {
  return readWoundQueue()
    .filter((entry) => (patientId ? entry.patientId === patientId : true))
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
}

export function enqueueOfflineWoundAssessment(
  payload: CreateNurseWoundAssessmentInput,
  meta: { patientLabel: string },
) {
  const nextEntry: OfflineWoundQueueEntry = {
    localId: createLocalId(),
    patientId: payload.patientId,
    patientLabel: meta.patientLabel,
    woundLabel: payload.woundLabel,
    zoneId: payload.zoneId,
    recordedAt: payload.recordedAt ?? new Date().toISOString(),
    retryCount: 0,
    payload: {
      ...payload,
      recordedAt: payload.recordedAt ?? new Date().toISOString(),
    },
  };
  const nextQueue = [...readWoundQueue(), nextEntry];
  writeWoundQueue(nextQueue);
  return nextEntry;
}

export async function flushOfflineWoundQueue(patientId?: string): Promise<OfflineWoundFlushResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const remaining = listOfflineWoundQueue(patientId).length;
    return {
      syncedCount: 0,
      failedCount: remaining,
      remainingCount: remaining,
    };
  }

  const queue = readWoundQueue();
  const remainingEntries: OfflineWoundQueueEntry[] = [];
  let syncedCount = 0;
  let failedCount = 0;

  for (const entry of queue) {
    if (patientId && entry.patientId !== patientId) {
      remainingEntries.push(entry);
      continue;
    }

    try {
      await createNurseWoundAssessment(entry.payload);
      syncedCount += 1;
    } catch (error) {
      failedCount += 1;
      remainingEntries.push({
        ...entry,
        retryCount: entry.retryCount + 1,
        lastError: error instanceof Error ? error.message : 'Synchronisation wound en erreur.',
      });
    }
  }

  writeWoundQueue(remainingEntries);

  return {
    syncedCount,
    failedCount,
    remainingCount: remainingEntries.filter((entry) => (patientId ? entry.patientId === patientId : true)).length,
  };
}

export function getOfflineClinicalQueueSnapshot(patientId?: string): OfflineClinicalQueueSnapshot {
  const woundEntries = listOfflineWoundQueue(patientId);
  const belraiEntries = listStoredBelraiDrafts()
    .filter((draft) => isBelraiDraftPendingSync(draft))
    .filter((draft) => (patientId ? draft.patientId === patientId : true))
    .map((draft) => ({
      patientId: draft.patientId,
      updatedAt: draft.updatedAt,
      status: draft.status,
      syncStatus: draft.syncStatus,
    }));
  const online = typeof navigator === 'undefined' ? true : navigator.onLine;
  const cacheKey = patientId ?? '__all__';
  const signature = JSON.stringify({
    online,
    woundEntries,
    belraiEntries,
  });
  const cachedSnapshot = offlineClinicalSnapshotCache.get(cacheKey);

  if (cachedSnapshot?.signature === signature) {
    return cachedSnapshot.snapshot;
  }

  const snapshot: OfflineClinicalQueueSnapshot = {
    online,
    woundEntries,
    belraiEntries,
    pendingCount: woundEntries.length + belraiEntries.length,
  };

  offlineClinicalSnapshotCache.set(cacheKey, {
    signature,
    snapshot,
  });

  return snapshot;
}

export function subscribeToOfflineClinicalQueue(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleChange = () => listener();

  window.addEventListener('online', handleChange);
  window.addEventListener('offline', handleChange);
  window.addEventListener('storage', handleChange);
  window.addEventListener(offlineClinicalQueueEvent, handleChange);

  return () => {
    window.removeEventListener('online', handleChange);
    window.removeEventListener('offline', handleChange);
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(offlineClinicalQueueEvent, handleChange);
  };
}
