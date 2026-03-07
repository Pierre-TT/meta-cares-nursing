import { endOfDay, startOfDay, subDays } from 'date-fns';
import type { Tables } from '@/lib/database.types';
import {
  HOURLY_PILOT_HOME_CARE_RATE,
  estimateForfaitAmount,
  hourlyPilotCatalog,
  type HourlyPilotCatalogEntry,
  type HourlyPilotPlaceOfService,
} from '@/lib/hourlyPilot';
import { supabase } from '@/lib/supabase';

type HourlyComparisonVisitRow = Pick<Tables<'visits'>, 'id' | 'scheduled_start'> & {
  patient: Pick<Tables<'patients'>, 'katz_category'> | null;
  visit_acts: Pick<Tables<'visit_acts'>, 'value_w'>[] | null;
  visit_hourly_billing_lines: Pick<Tables<'visit_hourly_billing_lines'>, 'code'>[] | null;
  visit_hourly_billing_summaries:
    | Tables<'visit_hourly_billing_summaries'>
    | Tables<'visit_hourly_billing_summaries'>[]
    | null;
};

type HourlyAdminSummaryRow = Tables<'visit_hourly_billing_summaries'>;
type HourlyAdminLineRow = Pick<Tables<'visit_hourly_billing_lines'>, 'code'>;

function normalizeToSingleRow<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDayLabel(value: Date) {
  return value.toLocaleDateString('fr-BE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

function formatDayKey(value: Date) {
  return value.toLocaleDateString('en-CA', { timeZone: 'Europe/Brussels' });
}

function toRounded(value: number, precision = 2) {
  return Number(value.toFixed(precision));
}

function getActsForfaitEuro(acts: Pick<Tables<'visit_acts'>, 'value_w'>[] | null) {
  const totalW = (acts ?? []).reduce((sum, act) => sum + act.value_w, 0);
  return estimateForfaitAmount(totalW);
}

export interface HourlyPilotDayComparison {
  dayKey: string;
  date: string;
  visits: number;
  totalMinutes: number;
  travelMinutes: number;
  directMinutes: number;
  indirectMinutes: number;
  forfaitEuro: number;
  hourlyEuro: number;
  delta: number;
  reviewCount: number;
}

export interface HourlyPilotKatzBreakdown {
  katz: string;
  visits: number;
  avgMinutes: number;
  forfaitEuro: number;
  hourlyEuro: number;
  delta: number;
}

type HourlyPilotKatzAccumulatorRow = Omit<HourlyPilotKatzBreakdown, 'avgMinutes' | 'delta'> & {
  minutes: number;
};

export interface HourlyPilotWeekComparison {
  days: HourlyPilotDayComparison[];
  totalForfaitEuro: number;
  totalHourlyEuro: number;
  totalDelta: number;
  totalMinutes: number;
  totalVisits: number;
  avgMinutesPerVisit: number;
  breakEvenMinutesPerVisit: number;
  visitsAboveBreakEvenRate: number;
  reviewCount: number;
  avgGeofencingCoverage?: number;
  previewCodes: string[];
  katzBreakdown: HourlyPilotKatzBreakdown[];
}

export interface HourlyPilotPlaceOverview {
  placeOfService: HourlyPilotPlaceOfService;
  visits: number;
  totalHours: number;
  hourlyAmount: number;
}

export interface HourlyPilotAdminOverview {
  totalVisits: number;
  totalBillableHours: number;
  hourlyAmount: number;
  forfaitAmount: number;
  deltaAmount: number;
  readyRate: number;
  reviewCount: number;
  avgGeofencingCoverage?: number;
  activePseudocodeCount: number;
  placeBreakdown: HourlyPilotPlaceOverview[];
  catalog: HourlyPilotCatalogEntry[];
}

export async function getNurseHourlyPilotWeekComparison(
  nurseId: string,
  days = 7,
): Promise<HourlyPilotWeekComparison> {
  const today = new Date();
  const start = startOfDay(subDays(today, days - 1));
  const end = endOfDay(today);
  const seededDays = Array.from({ length: days }, (_, index) => {
    const date = subDays(today, days - 1 - index);
    const dayKey = formatDayKey(date);

    return {
      dayKey,
      date: formatDayLabel(date),
      visits: 0,
      totalMinutes: 0,
      travelMinutes: 0,
      directMinutes: 0,
      indirectMinutes: 0,
      forfaitEuro: 0,
      hourlyEuro: 0,
      delta: 0,
      reviewCount: 0,
    } satisfies HourlyPilotDayComparison;
  });
  const daysByKey = new Map(seededDays.map((day) => [day.dayKey, day] as const));

  const { data, error } = await supabase
    .from('visits')
    .select(`
      id,
      scheduled_start,
      patient:patients!visits_patient_id_fkey (
        katz_category
      ),
      visit_acts (
        value_w
      ),
      visit_hourly_billing_summaries (
        place_of_service,
        total_travel_minutes,
        total_direct_minutes,
        total_indirect_minutes,
        total_billable_minutes,
        hourly_amount,
        estimated_forfait_amount,
        delta_amount,
        geofencing_coverage_ratio,
        requires_manual_review,
        review_reasons,
        status
      ),
      visit_hourly_billing_lines (
        code
      )
    `)
    .eq('nurse_id', nurseId)
    .gte('scheduled_start', start.toISOString())
    .lte('scheduled_start', end.toISOString())
    .order('scheduled_start', { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as HourlyComparisonVisitRow[];
  const geofencingCoverage: number[] = [];
  const previewCodes = new Set<string>();
  const katzAccumulator = new Map<string, HourlyPilotKatzAccumulatorRow>();
  let totalMinutes = 0;
  let totalVisits = 0;
  let totalForfaitEuro = 0;
  let totalHourlyEuro = 0;
  let reviewCount = 0;
  let visitsAboveBreakEven = 0;

  for (const row of rows) {
    const summary = normalizeToSingleRow(row.visit_hourly_billing_summaries);
    const dayKey = formatDayKey(new Date(row.scheduled_start));
    const day = daysByKey.get(dayKey);
    const forfaitEuro = summary?.estimated_forfait_amount ?? getActsForfaitEuro(row.visit_acts);
    const hourlyEuro = summary?.hourly_amount ?? 0;
    const visitMinutes = summary?.total_billable_minutes ?? 0;
    const breakEvenMinutes = HOURLY_PILOT_HOME_CARE_RATE > 0
      ? (forfaitEuro / HOURLY_PILOT_HOME_CARE_RATE) * 60
      : 0;

    if (day) {
      day.visits += 1;
      day.totalMinutes = toRounded(day.totalMinutes + visitMinutes);
      day.travelMinutes = toRounded(day.travelMinutes + (summary?.total_travel_minutes ?? 0));
      day.directMinutes = toRounded(day.directMinutes + (summary?.total_direct_minutes ?? 0));
      day.indirectMinutes = toRounded(day.indirectMinutes + (summary?.total_indirect_minutes ?? 0));
      day.forfaitEuro = toRounded(day.forfaitEuro + forfaitEuro);
      day.hourlyEuro = toRounded(day.hourlyEuro + hourlyEuro);
      day.delta = toRounded(day.delta + ((summary?.delta_amount ?? 0) || hourlyEuro - forfaitEuro));
      if (summary?.requires_manual_review) {
        day.reviewCount += 1;
      }
    }

    totalVisits += 1;
    totalMinutes = toRounded(totalMinutes + visitMinutes);
    totalForfaitEuro = toRounded(totalForfaitEuro + forfaitEuro);
    totalHourlyEuro = toRounded(totalHourlyEuro + hourlyEuro);

    if (summary?.requires_manual_review) {
      reviewCount += 1;
    }

    if (summary?.geofencing_coverage_ratio !== null && summary?.geofencing_coverage_ratio !== undefined) {
      geofencingCoverage.push(summary.geofencing_coverage_ratio);
    }

    if (visitMinutes >= breakEvenMinutes) {
      visitsAboveBreakEven += 1;
    }

    for (const line of row.visit_hourly_billing_lines ?? []) {
      previewCodes.add(line.code);
    }

    const katzKey = row.patient?.katz_category ?? 'N/A';
    const currentKatz = katzAccumulator.get(katzKey) ?? {
      katz: katzKey,
      visits: 0,
      forfaitEuro: 0,
      hourlyEuro: 0,
      minutes: 0,
    };

    currentKatz.visits += 1;
    currentKatz.minutes = toRounded(currentKatz.minutes + visitMinutes);
    currentKatz.forfaitEuro = toRounded(currentKatz.forfaitEuro + forfaitEuro);
    currentKatz.hourlyEuro = toRounded(currentKatz.hourlyEuro + hourlyEuro);
    katzAccumulator.set(katzKey, currentKatz);
  }

  const avgMinutesPerVisit = totalVisits > 0 ? Math.round(totalMinutes / totalVisits) : 0;
  const breakEvenMinutesPerVisit = totalVisits > 0
    ? Math.round(((totalForfaitEuro / totalVisits) / HOURLY_PILOT_HOME_CARE_RATE) * 60)
    : 0;
  const avgGeofencingCoverage = geofencingCoverage.length > 0
    ? toRounded(
      geofencingCoverage.reduce((sum, value) => sum + value, 0) / geofencingCoverage.length,
      4,
    )
    : undefined;

  return {
    days: seededDays.map((day) => ({
      ...day,
      delta: toRounded(day.hourlyEuro - day.forfaitEuro),
    })),
    totalForfaitEuro,
    totalHourlyEuro,
    totalDelta: toRounded(totalHourlyEuro - totalForfaitEuro),
    totalMinutes,
    totalVisits,
    avgMinutesPerVisit,
    breakEvenMinutesPerVisit,
    visitsAboveBreakEvenRate: totalVisits > 0
      ? Math.round((visitsAboveBreakEven / totalVisits) * 100)
      : 0,
    reviewCount,
    avgGeofencingCoverage,
    previewCodes: [...previewCodes],
    katzBreakdown: [...katzAccumulator.values()]
      .map((row) => ({
        katz: row.katz,
        visits: row.visits,
        avgMinutes: row.visits > 0 ? Math.round(row.minutes / row.visits) : 0,
        forfaitEuro: row.forfaitEuro,
        hourlyEuro: row.hourlyEuro,
        delta: toRounded(row.hourlyEuro - row.forfaitEuro),
      }))
      .sort((left, right) => left.katz.localeCompare(right.katz)),
  };
}

export async function getHourlyPilotAdminOverview(): Promise<HourlyPilotAdminOverview> {
  const [{ data: summaries, error: summariesError }, { data: lines, error: linesError }] = await Promise.all([
    supabase
      .from('visit_hourly_billing_summaries')
      .select(`
        visit_id,
        place_of_service,
        total_billable_minutes,
        hourly_amount,
        estimated_forfait_amount,
        delta_amount,
        geofencing_coverage_ratio,
        requires_manual_review
      `)
      .order('visit_id', { ascending: false }),
    supabase
      .from('visit_hourly_billing_lines')
      .select('code'),
  ]);

  if (summariesError) {
    throw summariesError;
  }

  if (linesError) {
    throw linesError;
  }

  const summaryRows = (summaries ?? []) as HourlyAdminSummaryRow[];
  const lineRows = (lines ?? []) as HourlyAdminLineRow[];
  const coverage = summaryRows
    .map((row) => row.geofencing_coverage_ratio)
    .filter((value): value is number => typeof value === 'number');
  const placeMap = new Map<HourlyPilotPlaceOfService, HourlyPilotPlaceOverview>();

  for (const row of summaryRows) {
    const place = row.place_of_service as HourlyPilotPlaceOfService;
    const current = placeMap.get(place) ?? {
      placeOfService: place,
      visits: 0,
      totalHours: 0,
      hourlyAmount: 0,
    };

    current.visits += 1;
    current.totalHours = toRounded(current.totalHours + row.total_billable_minutes / 60);
    current.hourlyAmount = toRounded(current.hourlyAmount + row.hourly_amount);
    placeMap.set(place, current);
  }

  const totalVisits = summaryRows.length;
  const reviewCount = summaryRows.filter((row) => row.requires_manual_review).length;
  const totalBillableHours = toRounded(
    summaryRows.reduce((sum, row) => sum + row.total_billable_minutes / 60, 0),
  );
  const hourlyAmount = toRounded(summaryRows.reduce((sum, row) => sum + row.hourly_amount, 0));
  const forfaitAmount = toRounded(
    summaryRows.reduce((sum, row) => sum + row.estimated_forfait_amount, 0),
  );
  const deltaAmount = toRounded(summaryRows.reduce((sum, row) => sum + row.delta_amount, 0));
  const readyRate = totalVisits > 0
    ? Math.round(((totalVisits - reviewCount) / totalVisits) * 100)
    : 0;
  const avgGeofencingCoverage = coverage.length > 0
    ? toRounded(coverage.reduce((sum, value) => sum + value, 0) / coverage.length, 4)
    : undefined;
  const activePseudocodeCount = new Set(lineRows.map((row) => row.code)).size;

  return {
    totalVisits,
    totalBillableHours,
    hourlyAmount,
    forfaitAmount,
    deltaAmount,
    readyRate,
    reviewCount,
    avgGeofencingCoverage,
    activePseudocodeCount,
    placeBreakdown: [...placeMap.values()].sort((left, right) => left.placeOfService.localeCompare(right.placeOfService)),
    catalog: hourlyPilotCatalog,
  };
}
