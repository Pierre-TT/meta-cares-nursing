import type { Json } from '@/lib/database.types';

export const DEFAULT_GEOFENCE_RADIUS_METERS = 75;
export const FORFAIT_W_EURO_RATE = 7.25;
export const HOURLY_PILOT_HOME_CARE_RATE = 59.1;
export const HOURLY_PILOT_OTHER_PLACE_CARE_RATE = 79.1;
export const HOURLY_PILOT_TRAVEL_RATE = 39.1;

export type HourlyPilotSegmentType = 'travel' | 'direct' | 'indirect';
export type HourlyPilotPlaceOfService = 'A' | 'B' | 'C';
export type HourlyPilotGeofenceState = 'inside' | 'outside' | 'unknown';
export type HourlyPilotLocationEventSource = 'device' | 'manual' | 'system';
export type HourlyPilotSegmentSource = 'geofence' | 'manual' | 'system';
export type HourlyPilotCareMode = Exclude<HourlyPilotSegmentType, 'travel'>;
export type HourlyPilotSummaryStatus = 'draft' | 'review' | 'validated' | 'exported';

export interface HourlyPilotCatalogEntry {
  code: string;
  label: string;
  segmentType: HourlyPilotSegmentType;
  appliesOnWeekend: boolean;
  homeHourlyRate: number;
  otherPlaceHourlyRate: number;
  description: string;
}

export interface HourlyPilotLocationEventInput {
  recordedAt: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  source?: HourlyPilotLocationEventSource;
  metadata?: Record<string, Json>;
}

export interface HourlyPilotLocationEventRecord extends HourlyPilotLocationEventInput {
  distanceToPatientMeters?: number;
  geofenceState: HourlyPilotGeofenceState;
}

export interface HourlyPilotCareTransition {
  recordedAt: string;
  careMode: HourlyPilotCareMode;
  source?: Exclude<HourlyPilotSegmentSource, 'geofence'>;
  note?: string;
}

export interface HourlyPilotSegmentDraft {
  segmentType: HourlyPilotSegmentType;
  source: HourlyPilotSegmentSource;
  placeOfService: HourlyPilotPlaceOfService;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  isBillable: boolean;
  requiresManualReview: boolean;
  isCorrected: boolean;
  correctionReason?: string | null;
  notes?: string | null;
  metadata: Json;
}

export interface HourlyPilotBillingLineDraft {
  code: string;
  label: string;
  segmentType: HourlyPilotSegmentType;
  placeOfService: HourlyPilotPlaceOfService;
  unitMinutes: number;
  hourlyRate: number;
  amount: number;
  isWeekendOrHoliday: boolean;
  justification?: string | null;
  payload: Json;
}

export interface HourlyPilotSummaryDraft {
  placeOfService: HourlyPilotPlaceOfService;
  totalTravelMinutes: number;
  totalDirectMinutes: number;
  totalIndirectMinutes: number;
  totalBillableMinutes: number;
  travelAmount: number;
  directAmount: number;
  indirectAmount: number;
  hourlyAmount: number;
  estimatedForfaitAmount: number;
  deltaAmount: number;
  indirectRatio?: number;
  geofencingEnabled: boolean;
  geofencingCoverageRatio?: number;
  requiresManualReview: boolean;
  reviewReasons: string[];
  status: HourlyPilotSummaryStatus;
  generatedAt: string;
}

export interface HourlyPilotVisitComputationInput {
  visitStartAt: string;
  visitEndAt: string;
  placeOfService: HourlyPilotPlaceOfService;
  geofencingEnabled?: boolean;
  geofenceRadiusMeters?: number;
  patientLatitude?: number | null;
  patientLongitude?: number | null;
  locationEvents?: HourlyPilotLocationEventInput[];
  careTransitions?: HourlyPilotCareTransition[];
  estimatedForfaitAmount?: number;
  holidayDates?: string[];
  manualCorrectionReason?: string | null;
}

export interface HourlyPilotVisitComputation {
  locationEvents: HourlyPilotLocationEventRecord[];
  segments: HourlyPilotSegmentDraft[];
  lines: HourlyPilotBillingLineDraft[];
  summary: HourlyPilotSummaryDraft;
}

export const hourlyPilotCatalog: HourlyPilotCatalogEntry[] = [
  {
    code: '421396',
    label: 'Trajet lié au patient — semaine',
    segmentType: 'travel',
    appliesOnWeekend: false,
    homeHourlyRate: HOURLY_PILOT_TRAVEL_RATE,
    otherPlaceHourlyRate: HOURLY_PILOT_TRAVEL_RATE,
    description: 'Temps de déplacement lié au patient presté en semaine, hors jours fériés.',
  },
  {
    code: '421492',
    label: 'Trajet lié au patient — week-end / jour férié',
    segmentType: 'travel',
    appliesOnWeekend: true,
    homeHourlyRate: HOURLY_PILOT_TRAVEL_RATE,
    otherPlaceHourlyRate: HOURLY_PILOT_TRAVEL_RATE,
    description: 'Temps de déplacement lié au patient presté le week-end ou un jour férié.',
  },
  {
    code: '423835',
    label: 'Soins infirmiers directs liés au patient — semaine',
    segmentType: 'direct',
    appliesOnWeekend: false,
    homeHourlyRate: HOURLY_PILOT_HOME_CARE_RATE,
    otherPlaceHourlyRate: HOURLY_PILOT_OTHER_PLACE_CARE_RATE,
    description: 'Temps de soins infirmiers directs au patient presté en semaine, hors jours fériés.',
  },
  {
    code: '423850',
    label: 'Soins infirmiers directs liés au patient — week-end / jour férié',
    segmentType: 'direct',
    appliesOnWeekend: true,
    homeHourlyRate: HOURLY_PILOT_HOME_CARE_RATE,
    otherPlaceHourlyRate: HOURLY_PILOT_OTHER_PLACE_CARE_RATE,
    description: 'Temps de soins infirmiers directs au patient presté le week-end ou un jour férié.',
  },
  {
    code: '423872',
    label: 'Soins infirmiers indirects liés au patient — semaine',
    segmentType: 'indirect',
    appliesOnWeekend: false,
    homeHourlyRate: HOURLY_PILOT_HOME_CARE_RATE,
    otherPlaceHourlyRate: HOURLY_PILOT_OTHER_PLACE_CARE_RATE,
    description: 'Temps de soins infirmiers indirects liés au patient presté en semaine, hors jours fériés.',
  },
  {
    code: '423953',
    label: 'Soins infirmiers indirects liés au patient — week-end / jour férié',
    segmentType: 'indirect',
    appliesOnWeekend: true,
    homeHourlyRate: HOURLY_PILOT_HOME_CARE_RATE,
    otherPlaceHourlyRate: HOURLY_PILOT_OTHER_PLACE_CARE_RATE,
    description: 'Temps de soins infirmiers indirects liés au patient presté le week-end ou un jour férié.',
  },
];

export const hourlyPilotPlaceLabels: Record<HourlyPilotPlaceOfService, string> = {
  A: 'Lieu A',
  B: 'Lieu B',
  C: 'Lieu C',
};

const geofenceStateLabels: Record<HourlyPilotGeofenceState, string> = {
  inside: 'Dans la zone patient',
  outside: 'Hors zone patient',
  unknown: 'Zone incertaine',
};

const segmentTypeLabels: Record<HourlyPilotSegmentType, string> = {
  travel: 'Déplacement',
  direct: 'Soin direct',
  indirect: 'Soin indirect',
};

function roundTo(value: number, precision = 2) {
  return Number(value.toFixed(precision));
}

function toIso(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function diffMinutes(startIso: string, endIso: string) {
  return Math.max(0, (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
}

function uniqueSortedIsos(values: string[]) {
  return [...new Set(values.map(toIso))].sort((left, right) => (
    new Date(left).getTime() - new Date(right).getTime()
  ));
}

function buildLocalDateKey(date: Date) {
  return date.toLocaleDateString('en-CA', { timeZone: 'Europe/Brussels' });
}

function isWeekendOrHoliday(value: string, holidayDates: string[] = []) {
  const date = new Date(value);
  const localKey = buildLocalDateKey(date);
  if (holidayDates.includes(localKey)) {
    return true;
  }

  const day = new Date(
    date.toLocaleString('en-US', { timeZone: 'Europe/Brussels' }),
  ).getDay();

  return day === 0 || day === 6;
}

export function getHourlyPilotSegmentLabel(segmentType: HourlyPilotSegmentType) {
  return segmentTypeLabels[segmentType];
}

export function getHourlyPilotGeofenceLabel(state: HourlyPilotGeofenceState) {
  return geofenceStateLabels[state];
}

export function getHourlyPilotPlaceLabel(placeOfService: HourlyPilotPlaceOfService) {
  return hourlyPilotPlaceLabels[placeOfService];
}

export function estimateForfaitAmount(totalW: number) {
  return roundTo(totalW * FORFAIT_W_EURO_RATE);
}

export function getHourlyPilotRate(
  segmentType: HourlyPilotSegmentType,
  placeOfService: HourlyPilotPlaceOfService,
) {
  if (segmentType === 'travel') {
    return HOURLY_PILOT_TRAVEL_RATE;
  }

  return placeOfService === 'A'
    ? HOURLY_PILOT_HOME_CARE_RATE
    : HOURLY_PILOT_OTHER_PLACE_CARE_RATE;
}

function getPilotCatalogEntry(segmentType: HourlyPilotSegmentType, weekendOrHoliday: boolean) {
  const entry = hourlyPilotCatalog.find(
    (item) => item.segmentType === segmentType && item.appliesOnWeekend === weekendOrHoliday,
  );

  if (!entry) {
    throw new Error(`Aucun pseudocode pilote disponible pour ${segmentType}.`);
  }

  return entry;
}

export function getHourlyPilotPseudocode(
  segmentType: HourlyPilotSegmentType,
  value: string,
  holidayDates: string[] = [],
) {
  const weekendOrHoliday = isWeekendOrHoliday(value, holidayDates);
  return getPilotCatalogEntry(segmentType, weekendOrHoliday);
}

export function computeDistanceMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);
  const latARadians = toRadians(latitudeA);
  const latBRadians = toRadians(latitudeB);

  const a = Math.sin(deltaLatitude / 2) ** 2
    + Math.sin(deltaLongitude / 2) ** 2 * Math.cos(latARadians) * Math.cos(latBRadians);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

export function resolveGeofenceState(input: {
  latitude: number;
  longitude: number;
  patientLatitude?: number | null;
  patientLongitude?: number | null;
  accuracyMeters?: number;
  geofenceRadiusMeters?: number;
}): Pick<HourlyPilotLocationEventRecord, 'distanceToPatientMeters' | 'geofenceState'> {
  if (input.patientLatitude == null || input.patientLongitude == null) {
    return {
      geofenceState: 'unknown',
      distanceToPatientMeters: undefined,
    };
  }

  const distanceToPatientMeters = computeDistanceMeters(
    input.latitude,
    input.longitude,
    input.patientLatitude,
    input.patientLongitude,
  );
  const geofenceRadiusMeters = input.geofenceRadiusMeters ?? DEFAULT_GEOFENCE_RADIUS_METERS;
  const accuracyMeters = input.accuracyMeters;

  if (typeof accuracyMeters === 'number' && accuracyMeters > Math.max(geofenceRadiusMeters, 120)) {
    return {
      distanceToPatientMeters: roundTo(distanceToPatientMeters, 2),
      geofenceState: 'unknown',
    };
  }

  return {
    distanceToPatientMeters: roundTo(distanceToPatientMeters, 2),
    geofenceState: distanceToPatientMeters <= geofenceRadiusMeters ? 'inside' : 'outside',
  };
}

function normalizeLocationEvents(input: HourlyPilotVisitComputationInput) {
  const geofencingEnabled = input.geofencingEnabled ?? false;
  const geofenceRadiusMeters = input.geofenceRadiusMeters ?? DEFAULT_GEOFENCE_RADIUS_METERS;

  return (input.locationEvents ?? [])
    .map<HourlyPilotLocationEventRecord>((event) => {
      const geofence = geofencingEnabled
        ? resolveGeofenceState({
          latitude: event.latitude,
          longitude: event.longitude,
          patientLatitude: input.patientLatitude,
          patientLongitude: input.patientLongitude,
          accuracyMeters: event.accuracyMeters,
          geofenceRadiusMeters,
        })
        : { geofenceState: 'unknown' as const, distanceToPatientMeters: undefined };

      return {
        ...event,
        recordedAt: toIso(event.recordedAt),
        source: event.source ?? 'device',
        metadata: event.metadata ?? {},
        accuracyMeters: event.accuracyMeters,
        geofenceState: geofence.geofenceState,
        distanceToPatientMeters: geofence.distanceToPatientMeters,
      };
    })
    .filter((event) => {
      const recordedAtTime = new Date(event.recordedAt).getTime();
      const startTime = new Date(input.visitStartAt).getTime();
      const endTime = new Date(input.visitEndAt).getTime();
      return recordedAtTime >= startTime && recordedAtTime <= endTime;
    })
    .sort((left, right) => new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime());
}

function normalizeCareTransitions(input: HourlyPilotVisitComputationInput) {
  return (input.careTransitions ?? [])
    .map((transition) => ({
      ...transition,
      recordedAt: toIso(transition.recordedAt),
      source: transition.source ?? 'manual',
    }))
    .filter((transition) => {
      const recordedAtTime = new Date(transition.recordedAt).getTime();
      const startTime = new Date(input.visitStartAt).getTime();
      const endTime = new Date(input.visitEndAt).getTime();
      return recordedAtTime >= startTime && recordedAtTime <= endTime;
    })
    .sort((left, right) => new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime());
}

function getLastValueBefore<T extends { recordedAt: string }>(items: T[], iso: string) {
  let current: T | undefined;

  for (const item of items) {
    if (new Date(item.recordedAt).getTime() <= new Date(iso).getTime()) {
      current = item;
      continue;
    }

    break;
  }

  return current;
}

function createFallbackSegment(
  input: HourlyPilotVisitComputationInput,
  careMode: HourlyPilotCareMode,
  reason?: string,
): HourlyPilotSegmentDraft {
  return {
    segmentType: careMode,
    source: input.geofencingEnabled ? 'system' : 'manual',
    placeOfService: input.placeOfService,
    startedAt: toIso(input.visitStartAt),
    endedAt: toIso(input.visitEndAt),
    durationMinutes: roundTo(diffMinutes(input.visitStartAt, input.visitEndAt), 2),
    isBillable: true,
    requiresManualReview: Boolean(reason),
    isCorrected: Boolean(input.manualCorrectionReason),
    correctionReason: input.manualCorrectionReason ?? null,
    notes: reason ?? null,
    metadata: {
      fallback: true,
      reason: reason ?? null,
    },
  };
}

function mergeContiguousSegments(segments: HourlyPilotSegmentDraft[]) {
  return segments.reduce<HourlyPilotSegmentDraft[]>((accumulator, segment) => {
    const previous = accumulator[accumulator.length - 1];

    if (
      previous
      && previous.segmentType === segment.segmentType
      && previous.source === segment.source
      && previous.placeOfService === segment.placeOfService
      && previous.requiresManualReview === segment.requiresManualReview
      && previous.correctionReason === segment.correctionReason
      && previous.notes === segment.notes
      && previous.endedAt === segment.startedAt
    ) {
      previous.endedAt = segment.endedAt;
      previous.durationMinutes = roundTo(previous.durationMinutes + segment.durationMinutes, 2);
      return accumulator;
    }

    accumulator.push({ ...segment });
    return accumulator;
  }, []);
}

function splitSegmentByLocalDay(
  segment: HourlyPilotSegmentDraft,
  holidayDates: string[] = [],
) {
  const parts: HourlyPilotSegmentDraft[] = [];
  let currentStart = new Date(segment.startedAt);
  const end = new Date(segment.endedAt);

  while (buildLocalDateKey(currentStart) !== buildLocalDateKey(end)) {
    const boundary = new Date(currentStart);
    boundary.setHours(24, 0, 0, 0);
    const boundaryIso = boundary.toISOString();
    parts.push({
      ...segment,
      startedAt: currentStart.toISOString(),
      endedAt: boundaryIso,
      durationMinutes: roundTo(diffMinutes(currentStart.toISOString(), boundaryIso), 2),
      metadata: {
        ...((segment.metadata as Record<string, Json>) ?? {}),
        splitForDayBoundary: true,
      },
    });
    currentStart = boundary;
  }

  parts.push({
    ...segment,
    startedAt: currentStart.toISOString(),
    endedAt: end.toISOString(),
    durationMinutes: roundTo(diffMinutes(currentStart.toISOString(), end.toISOString()), 2),
    metadata: {
      ...((segment.metadata as Record<string, Json>) ?? {}),
      splitForDayBoundary: parts.length > 0,
      holidayDates,
    },
  });

  return parts;
}

function buildBillingLineForSegment(
  segment: HourlyPilotSegmentDraft,
  holidayDates: string[] = [],
): HourlyPilotBillingLineDraft {
  const catalogEntry = getHourlyPilotPseudocode(segment.segmentType, segment.startedAt, holidayDates);
  const hourlyRate = getHourlyPilotRate(segment.segmentType, segment.placeOfService);
  const amount = roundTo((segment.durationMinutes / 60) * hourlyRate);
  const weekendOrHoliday = isWeekendOrHoliday(segment.startedAt, holidayDates);

  return {
    code: catalogEntry.code,
    label: catalogEntry.label,
    segmentType: segment.segmentType,
    placeOfService: segment.placeOfService,
    unitMinutes: roundTo(segment.durationMinutes, 2),
    hourlyRate,
    amount,
    isWeekendOrHoliday: weekendOrHoliday,
    justification: segment.notes ?? null,
    payload: {
      startedAt: segment.startedAt,
      endedAt: segment.endedAt,
      source: segment.source,
      requiresManualReview: segment.requiresManualReview,
    },
  };
}

function buildSegments(input: HourlyPilotVisitComputationInput, locationEvents: HourlyPilotLocationEventRecord[]) {
  const careTransitions = normalizeCareTransitions(input);
  const boundaries = uniqueSortedIsos([
    input.visitStartAt,
    input.visitEndAt,
    ...locationEvents.map((event) => event.recordedAt),
    ...careTransitions.map((transition) => transition.recordedAt),
  ]);
  const hasPatientCoordinates = input.patientLatitude != null && input.patientLongitude != null;
  const geofencingEnabled = input.geofencingEnabled ?? false;
  const reviewReasons = new Set<string>();
  const segments: HourlyPilotSegmentDraft[] = [];

  if (boundaries.length <= 1) {
    return {
      reviewReasons: ['Visite invalide: début/fin manquants pour le calcul pilote.'],
      segments: [createFallbackSegment(input, 'direct', 'Visite invalide: calcul manuel requis.')],
    };
  }

  if (geofencingEnabled && input.placeOfService === 'A' && !hasPatientCoordinates) {
    reviewReasons.add('Coordonnées patient manquantes: geofencing impossible.');
  }

  if (geofencingEnabled && input.placeOfService === 'A' && locationEvents.length === 0) {
    reviewReasons.add('Aucun point GPS capturé pendant la visite.');
  }

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const startedAt = boundaries[index];
    const endedAt = boundaries[index + 1];
    const durationMinutes = roundTo(diffMinutes(startedAt, endedAt), 2);

    if (durationMinutes <= 0) {
      continue;
    }

    const activeTransition = getLastValueBefore(
      careTransitions,
      startedAt,
    ) ?? { recordedAt: input.visitStartAt, careMode: 'direct' as const, source: 'system' as const };
    const activeLocation = getLastValueBefore(locationEvents, startedAt);
    let segmentType: HourlyPilotSegmentType = activeTransition.careMode;
    let source: HourlyPilotSegmentSource = activeTransition.source ?? 'system';
    let requiresManualReview = false;
    let note: string | null = null;

    if (geofencingEnabled && input.placeOfService === 'A' && hasPatientCoordinates) {
      if (activeLocation?.geofenceState === 'outside') {
        segmentType = 'travel';
        source = 'geofence';
      } else if (activeLocation?.geofenceState === 'inside') {
        segmentType = activeTransition.careMode;
        source = activeTransition.careMode === 'indirect' ? activeTransition.source ?? 'manual' : 'geofence';
      } else {
        segmentType = activeTransition.careMode;
        source = activeTransition.source ?? 'system';
        requiresManualReview = true;
        note = 'Segment calculé sans certitude geofence.';
        reviewReasons.add('Couverture geofence incomplète: validation manuelle recommandée.');
      }
    } else if (geofencingEnabled && input.placeOfService === 'A' && !hasPatientCoordinates) {
      segmentType = activeTransition.careMode;
      source = activeTransition.source ?? 'system';
      requiresManualReview = true;
      note = 'Coordonnées patient indisponibles.';
    }

    segments.push({
      segmentType,
      source,
      placeOfService: input.placeOfService,
      startedAt,
      endedAt,
      durationMinutes,
      isBillable: true,
      requiresManualReview,
      isCorrected: Boolean(input.manualCorrectionReason),
      correctionReason: input.manualCorrectionReason ?? null,
      notes: activeTransition.note ?? note,
      metadata: {
        geofenceState: activeLocation?.geofenceState ?? 'unknown',
        distanceToPatientMeters: activeLocation?.distanceToPatientMeters ?? null,
        careMode: activeTransition.careMode,
      },
    });
  }

  if (segments.length === 0) {
    const fallbackReason = geofencingEnabled
      ? 'Aucun segment calculable automatiquement.'
      : undefined;
    return {
      reviewReasons: fallbackReason ? [fallbackReason] : [],
      segments: [createFallbackSegment(input, 'direct', fallbackReason)],
    };
  }

  const mergedSegments = mergeContiguousSegments(segments);

  if (!mergedSegments.some((segment) => segment.segmentType === 'direct')) {
    reviewReasons.add('Aucun segment de soin direct détecté sur cette visite.');
  }

  return {
    reviewReasons: [...reviewReasons],
    segments: mergedSegments,
  };
}

function getGeofencingCoverageRatio(locationEvents: HourlyPilotLocationEventRecord[], geofencingEnabled: boolean) {
  if (!geofencingEnabled) {
    return undefined;
  }

  if (locationEvents.length === 0) {
    return 0;
  }

  const knownStates = locationEvents.filter((event) => event.geofenceState !== 'unknown').length;
  return roundTo(knownStates / locationEvents.length, 4);
}

export function buildHourlyPilotVisitComputation(
  input: HourlyPilotVisitComputationInput,
): HourlyPilotVisitComputation {
  const normalizedInput: HourlyPilotVisitComputationInput = {
    ...input,
    visitStartAt: toIso(input.visitStartAt),
    visitEndAt: toIso(input.visitEndAt),
    geofencingEnabled: input.geofencingEnabled ?? false,
    geofenceRadiusMeters: input.geofenceRadiusMeters ?? DEFAULT_GEOFENCE_RADIUS_METERS,
    holidayDates: input.holidayDates ?? [],
  };

  if (new Date(normalizedInput.visitEndAt).getTime() <= new Date(normalizedInput.visitStartAt).getTime()) {
    throw new Error('La fin de visite doit être postérieure au début de visite pour le calcul pilote.');
  }

  const locationEvents = normalizeLocationEvents(normalizedInput);
  const segmentBuild = buildSegments(normalizedInput, locationEvents);
  const splitSegments = segmentBuild.segments.flatMap((segment) =>
    splitSegmentByLocalDay(segment, normalizedInput.holidayDates),
  );
  const lines = splitSegments
    .filter((segment) => segment.isBillable && segment.durationMinutes > 0)
    .map((segment) => buildBillingLineForSegment(segment, normalizedInput.holidayDates));

  const totalTravelMinutes = roundTo(
    segmentBuild.segments
      .filter((segment) => segment.segmentType === 'travel')
      .reduce((sum, segment) => sum + segment.durationMinutes, 0),
    2,
  );
  const totalDirectMinutes = roundTo(
    segmentBuild.segments
      .filter((segment) => segment.segmentType === 'direct')
      .reduce((sum, segment) => sum + segment.durationMinutes, 0),
    2,
  );
  const totalIndirectMinutes = roundTo(
    segmentBuild.segments
      .filter((segment) => segment.segmentType === 'indirect')
      .reduce((sum, segment) => sum + segment.durationMinutes, 0),
    2,
  );
  const travelAmount = roundTo(
    lines
      .filter((line) => line.segmentType === 'travel')
      .reduce((sum, line) => sum + line.amount, 0),
  );
  const directAmount = roundTo(
    lines
      .filter((line) => line.segmentType === 'direct')
      .reduce((sum, line) => sum + line.amount, 0),
  );
  const indirectAmount = roundTo(
    lines
      .filter((line) => line.segmentType === 'indirect')
      .reduce((sum, line) => sum + line.amount, 0),
  );
  const totalBillableMinutes = roundTo(totalTravelMinutes + totalDirectMinutes + totalIndirectMinutes, 2);
  const hourlyAmount = roundTo(travelAmount + directAmount + indirectAmount);
  const estimatedForfaitAmount = roundTo(normalizedInput.estimatedForfaitAmount ?? 0);
  const indirectCareMinutes = totalDirectMinutes + totalIndirectMinutes;
  const indirectRatio = indirectCareMinutes > 0
    ? roundTo(totalIndirectMinutes / indirectCareMinutes, 4)
    : undefined;
  const geofencingCoverageRatio = getGeofencingCoverageRatio(
    locationEvents,
    normalizedInput.geofencingEnabled ?? false,
  );
  const reviewReasons = [
    ...segmentBuild.reviewReasons,
    ...(normalizedInput.manualCorrectionReason ? ['Correction manuelle fournie sur la visite.'] : []),
    ...(
      geofencingCoverageRatio !== undefined && geofencingCoverageRatio < 0.6
        ? ['Couverture GPS inférieure à 60% des points collectés.']
        : []
    ),
  ];
  const summary: HourlyPilotSummaryDraft = {
    placeOfService: normalizedInput.placeOfService,
    totalTravelMinutes,
    totalDirectMinutes,
    totalIndirectMinutes,
    totalBillableMinutes,
    travelAmount,
    directAmount,
    indirectAmount,
    hourlyAmount,
    estimatedForfaitAmount,
    deltaAmount: roundTo(hourlyAmount - estimatedForfaitAmount),
    indirectRatio,
    geofencingEnabled: normalizedInput.geofencingEnabled ?? false,
    geofencingCoverageRatio,
    requiresManualReview: reviewReasons.length > 0,
    reviewReasons,
    status: reviewReasons.length > 0 ? 'review' : 'draft',
    generatedAt: new Date().toISOString(),
  };

  return {
    locationEvents,
    segments: segmentBuild.segments,
    lines,
    summary,
  };
}
