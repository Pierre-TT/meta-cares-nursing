import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Heart,
  Activity,
  Scissors,
  FileText,
  CheckCircle,
  ChevronRight,
  Pause,
  Play,
  Thermometer,
  Droplets,
  Weight,
  Stethoscope,
  PenLine,
  X,
  ArrowLeft,
  Mic,
  MicOff,
  ScanBarcode,
  Camera,
  AlertTriangle,
  CarFront,
  LocateFixed,
  MapPin,
  Route,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, Badge, Input, AnimatedPage } from '@/design-system';
import { useSaveNurseVisit } from '@/hooks/useNurseClinicalData';
import { useNursePatient } from '@/hooks/useNursePatients';
import { SmartVisitBriefingCard } from '@/components/nurse/SmartVisitBriefingCard';
import type { NurseVisitAct } from '@/lib/nurseClinical';
import {
  DEFAULT_GEOFENCE_RADIUS_METERS,
  type HourlyPilotCareTransition,
  buildHourlyPilotVisitComputation,
  estimateForfaitAmount,
  getHourlyPilotGeofenceLabel,
  getHourlyPilotSegmentLabel,
  type HourlyPilotCareMode,
  type HourlyPilotLocationEventInput,
  type HourlyPilotPlaceOfService,
} from '@/lib/hourlyPilot';
import { useAuthStore } from '@/stores/authStore';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';

type VisitStep = 'identification' | 'vitals' | 'acts' | 'notes' | 'summary';

const steps: { id: VisitStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'identification', label: 'Patient', icon: Stethoscope },
  { id: 'vitals', label: 'Paramètres', icon: Activity },
  { id: 'acts', label: 'Actes', icon: Scissors },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'summary', label: 'Résumé', icon: CheckCircle },
];

const availableActs = [
  { code: '425110', label: 'Toilette complète', valueW: 5.143, category: 'toilette' },
  { code: '425132', label: 'Toilette partielle', valueW: 2.571, category: 'toilette' },
  { code: '425375', label: 'Injection SC/IM', valueW: 3.086, category: 'injection' },
  { code: '425596', label: 'Pansement simple', valueW: 3.086, category: 'wound' },
  { code: '425611', label: 'Pansement complexe', valueW: 5.143, category: 'wound' },
  { code: '425434', label: 'Préparation médicaments', valueW: 3.6, category: 'medication' },
  { code: '425456', label: 'Admin. médicaments', valueW: 2.571, category: 'medication' },
  { code: '425670', label: 'Surveillance paramètres', valueW: 1.543, category: 'consultation' },
  { code: '425692', label: 'Consultation infirmière', valueW: 3.086, category: 'consultation' },
];

export function ActiveVisitPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<VisitStep>('identification');
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [visitStartedAt] = useState(() => new Date().toISOString());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const saveVisitMutation = useSaveNurseVisit();
  const watchIdRef = useRef<number | null>(null);

  // Form state
  const [vitals, setVitals] = useState({
    systolic: '', diastolic: '', heartRate: '', temperature: '', spo2: '', glycemia: '', weight: '', pain: '',
  });
  const [selectedActs, setSelectedActs] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [barcodeResult, setBarcodeResult] = useState<string | null>(null);

  // Real voice dictation
  const voice = useVoiceRecognition('fr-BE');
  const lastVoiceTranscriptRef = useRef('');
  useEffect(() => { lastVoiceTranscriptRef.current = voice.transcript; }, [voice.transcript]);
  useEffect(() => {
    if (!voice.isRecording && lastVoiceTranscriptRef.current) {
      setNotes((prev) => prev ? `${prev}\n${lastVoiceTranscriptRef.current}` : lastVoiceTranscriptRef.current);
      lastVoiceTranscriptRef.current = '';
    }
  }, [voice.isRecording]);
  const { data: patient, isLoading, error, refetch } = useNursePatient(id);
  const [placeOfService, setPlaceOfService] = useState<HourlyPilotPlaceOfService>('A');
  const [careMode, setCareMode] = useState<HourlyPilotCareMode>('direct');
  const [careTransitions, setCareTransitions] = useState<HourlyPilotCareTransition[]>(() => [
    { recordedAt: visitStartedAt, careMode: 'direct' as const, source: 'system' as const, note: 'Début visite' },
  ]);
  const [locationEvents, setLocationEvents] = useState<HourlyPilotLocationEventInput[]>([]);
  const [geofencingPreference, setGeofencingPreference] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualCorrectionReason, setManualCorrectionReason] = useState('');

  // Timer logic
  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const parseIntegerValue = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const parseDecimalValue = (value: string) => {
    const parsed = Number.parseFloat(value.replace(',', '.'));
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const patientLatitude = patient?.address.lat;
  const patientLongitude = patient?.address.lng;
  const geofencingAvailable = patientLatitude != null && patientLongitude != null;
  const geofencingEnabled = geofencingAvailable && geofencingPreference;
  const totalW = selectedActs.reduce((sum, code) => {
    const act = availableActs.find((entry) => entry.code === code);
    return sum + (act?.valueW ?? 0);
  }, 0);

  useEffect(() => {
    if (
      !timerRunning
      || !geofencingEnabled
      || patientLatitude == null
      || patientLongitude == null
      || typeof navigator === 'undefined'
      || !navigator.geolocation
    ) {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return undefined;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocationError(null);
        setLocationEvents((previous) => [
          ...previous,
          {
            recordedAt: new Date().toISOString(),
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: position.coords.accuracy,
            source: 'device',
            metadata: {
              geofenceRadiusMeters: DEFAULT_GEOFENCE_RADIUS_METERS,
            },
          },
        ]);
      },
      () => {
        setLocationError('Le suivi GPS n’est pas disponible pour cette visite.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15_000,
        timeout: 10_000,
      },
    );

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [geofencingEnabled, patientLatitude, patientLongitude, timerRunning]);

  const captureCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('La géolocalisation navigateur n’est pas disponible.');
      return;
    }

    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationEvents((previous) => [
          ...previous,
          {
            recordedAt: new Date().toISOString(),
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: position.coords.accuracy,
            source: 'manual',
            metadata: {
              capturedManually: true,
              geofenceRadiusMeters: DEFAULT_GEOFENCE_RADIUS_METERS,
            },
          },
        ]);
      },
      () => {
        setLocationError('Impossible de capturer la position actuelle.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
      },
    );
  };

  const setPilotCareMode = (nextMode: HourlyPilotCareMode) => {
    setCareMode(nextMode);
    setCareTransitions((previous) => {
      const lastTransition = previous[previous.length - 1];
      if (lastTransition?.careMode === nextMode) {
        return previous;
      }

      return [
        ...previous,
        {
          recordedAt: new Date().toISOString(),
          careMode: nextMode,
          source: 'manual',
          note: nextMode === 'indirect' ? 'Bascule manuelle vers soin indirect.' : 'Retour en soin direct.',
        },
      ];
    });
  };

  const previewEndedAt = useMemo(() => {
    const startedAtMs = new Date(visitStartedAt).getTime();
    const minimumEndTime = startedAtMs + 60_000;
    const elapsedEndTime = startedAtMs + (timer * 1000);
    return new Date(Math.max(elapsedEndTime, minimumEndTime)).toISOString();
  }, [timer, visitStartedAt]);

  const hourlyPilotPreview = useMemo(() => {
    try {
      return buildHourlyPilotVisitComputation({
        visitStartAt: visitStartedAt,
        visitEndAt: previewEndedAt,
        placeOfService,
        geofencingEnabled,
        geofenceRadiusMeters: DEFAULT_GEOFENCE_RADIUS_METERS,
        patientLatitude,
        patientLongitude,
        locationEvents,
        careTransitions,
        estimatedForfaitAmount: estimateForfaitAmount(totalW),
        manualCorrectionReason: manualCorrectionReason.trim() || null,
      });
    } catch {
      return null;
    }
  }, [
    careTransitions,
    geofencingEnabled,
    locationEvents,
    manualCorrectionReason,
    patientLatitude,
    patientLongitude,
    placeOfService,
    previewEndedAt,
    totalW,
    visitStartedAt,
  ]);

  const previewSummary = hourlyPilotPreview?.summary;
  const previewLines = hourlyPilotPreview?.lines ?? [];
  const previewLocation = hourlyPilotPreview?.locationEvents[hourlyPilotPreview.locationEvents.length - 1];
  const previewCodes = [...new Set(previewLines.map((line) => line.code))];

  const stepIndex = steps.findIndex((s) => s.id === currentStep);

  const goNext = () => {
    const idx = stepIndex + 1;
    if (idx < steps.length) setCurrentStep(steps[idx].id);
  };

  const goPrev = () => {
    const idx = stepIndex - 1;
    if (idx >= 0) setCurrentStep(steps[idx].id);
  };
  if (error) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-3">
        <h2 className="text-lg font-bold">Visite indisponible</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Les informations du patient n’ont pas pu être chargées.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Réessayer
          </Button>
          <Button variant="outline" onClick={() => navigate('/nurse/tour')}>
            Retour
          </Button>
        </div>
      </AnimatedPage>
    );
  }

  if (isLoading) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <p className="text-sm text-[var(--text-muted)]">Chargement de la visite…</p>
      </AnimatedPage>
    );
  }

  if (!patient) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-sm text-[var(--text-muted)]">Patient introuvable</p>
        <Button variant="outline" onClick={() => navigate('/nurse/tour')} className="mt-4">Retour</Button>
      </AnimatedPage>
    );
  }


  const handleCompleteVisit = async () => {
    setSubmitError(null);
    setTimerRunning(false);

    const visitActs: NurseVisitAct[] = selectedActs.flatMap((code) => {
      const act = availableActs.find((entry) => entry.code === code);

      return act
        ? [{
          code: act.code,
          label: act.label,
          valueW: act.valueW,
          category: act.category,
        }]
        : [];
    });

    try {
      const completedAt = new Date().toISOString();
      const savedVisit = await saveVisitMutation.mutateAsync({
        patientId: patient.databaseId,
        nurseId: user?.role === 'nurse' ? user.id : undefined,
        startedAt: visitStartedAt,
        completedAt,
        notes: notes.trim() || null,
        acts: visitActs,
        vitals: {
          bloodPressureSystolic: parseIntegerValue(vitals.systolic),
          bloodPressureDiastolic: parseIntegerValue(vitals.diastolic),
          heartRate: parseIntegerValue(vitals.heartRate),
          temperature: parseDecimalValue(vitals.temperature),
          oxygenSaturation: parseIntegerValue(vitals.spo2),
          glycemia: parseDecimalValue(vitals.glycemia),
          weight: parseDecimalValue(vitals.weight),
          pain: parseIntegerValue(vitals.pain),
        },
        hourlyPilot: {
          placeOfService,
          geofencingEnabled,
          geofenceRadiusMeters: DEFAULT_GEOFENCE_RADIUS_METERS,
          patientLatitude,
          patientLongitude,
          locationEvents,
          careTransitions,
          manualCorrectionReason: manualCorrectionReason.trim() || null,
        },
      });

      navigate(`/nurse/visit/${patient.id}/summary`, {
        state: { visitId: savedVisit.id },
      });
    } catch {
      setSubmitError('La visite n’a pas pu être enregistrée. Réessayez.');
    }
  };

  return (
    <AnimatedPage className="px-4 py-4 max-w-2xl mx-auto space-y-4">
      {/* Header with timer */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/nurse/tour')}
          className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-sm font-bold ${timerRunning ? 'bg-mc-blue-50 dark:bg-mc-blue-900/30 text-mc-blue-600' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>
            <Clock className="h-4 w-4" />
            {formatTime(timer)}
          </div>
          <button
            onClick={() => setTimerRunning(!timerRunning)}
            className={`h-8 w-8 rounded-full flex items-center justify-center ${timerRunning ? 'bg-mc-amber-500 text-white' : 'bg-mc-green-500 text-white'}`}
          >
            {timerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
        </div>

        <Badge variant="blue">
          {patient.firstName} {patient.lastName}
        </Badge>
      </div>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-mc-blue-500" />
              <p className="text-sm font-semibold">Pilote horaire INAMI</p>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Geofencing, temps de déplacement, soin direct/indirect et pseudocodes automatiques.
            </p>
          </div>
          <Badge variant={previewSummary?.requiresManualReview ? 'amber' : 'green'}>
            {previewSummary?.requiresManualReview ? 'Revue manuelle' : 'Calcul prêt'}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-[var(--text-muted)]">
            <span>Lieu de prestation</span>
            <select
              value={placeOfService}
              onChange={(event) => setPlaceOfService(event.target.value as HourlyPilotPlaceOfService)}
              className="w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-mc-blue-500"
            >
              <option value="A">Lieu A</option>
              <option value="B">Lieu B</option>
              <option value="C">Lieu C</option>
            </select>
          </label>

          <div className="space-y-1">
            <span className="text-xs text-[var(--text-muted)]">Mode courant</span>
            <div className="grid grid-cols-2 gap-2">
              {(['direct', 'indirect'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPilotCareMode(mode)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                    careMode === mode
                      ? 'border-mc-blue-500 bg-mc-blue-50 text-mc-blue-600 dark:bg-mc-blue-900/20'
                      : 'border-[var(--border-default)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                  }`}
                >
                  {getHourlyPilotSegmentLabel(mode)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!geofencingAvailable}
            onClick={() => {
              setLocationError(null);
              setGeofencingPreference((current) => !current);
            }}
          >
            <MapPin className="h-4 w-4" />
            {geofencingEnabled ? 'Geofencing actif' : 'Geofencing manuel'}
          </Button>
          <Button variant="outline" size="sm" onClick={captureCurrentLocation}>
            <LocateFixed className="h-4 w-4" />
            Capturer position
          </Button>
          <Badge
            variant={
              previewLocation?.geofenceState === 'inside'
                ? 'green'
                : previewLocation?.geofenceState === 'outside'
                  ? 'blue'
                  : 'amber'
            }
          >
            {previewLocation ? getHourlyPilotGeofenceLabel(previewLocation.geofenceState) : 'Aucun point GPS'}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[var(--bg-tertiary)] p-3 text-center">
            <CarFront className="mx-auto h-4 w-4 text-mc-blue-500" />
            <p className="mt-1 text-xs text-[var(--text-muted)]">Déplacement</p>
            <p className="text-sm font-bold">{Math.round(previewSummary?.totalTravelMinutes ?? 0)} min</p>
          </div>
          <div className="rounded-xl bg-[var(--bg-tertiary)] p-3 text-center">
            <MapPin className="mx-auto h-4 w-4 text-mc-green-500" />
            <p className="mt-1 text-xs text-[var(--text-muted)]">Direct</p>
            <p className="text-sm font-bold">{Math.round(previewSummary?.totalDirectMinutes ?? 0)} min</p>
          </div>
          <div className="rounded-xl bg-[var(--bg-tertiary)] p-3 text-center">
            <FileText className="mx-auto h-4 w-4 text-mc-amber-500" />
            <p className="mt-1 text-xs text-[var(--text-muted)]">Indirect</p>
            <p className="text-sm font-bold">{Math.round(previewSummary?.totalIndirectMinutes ?? 0)} min</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>{locationEvents.length} point(s) GPS</span>
          <span>•</span>
          <span>{previewCodes.length} pseudocode(s) distinct(s)</span>
          <span>•</span>
          <span>Δ €{(previewSummary?.deltaAmount ?? 0).toFixed(2)}</span>
        </div>

        {previewCodes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {previewCodes.map((code) => (
              <Badge key={code} variant="outline">{code}</Badge>
            ))}
          </div>
        )}

        {(patientLatitude == null || patientLongitude == null) && (
          <div className="flex items-start gap-2 rounded-xl border border-mc-amber-200 bg-mc-amber-50/70 p-3 text-xs text-mc-amber-700 dark:border-amber-800 dark:bg-amber-900/10 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Coordonnées patient indisponibles: le moteur passera en calcul manuel avec revue obligatoire.
            </span>
          </div>
        )}

        {locationError && (
          <div className="flex items-start gap-2 rounded-xl border border-mc-red-200 bg-mc-red-50/70 p-3 text-xs text-mc-red-600 dark:border-red-800 dark:bg-red-900/10 dark:text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{locationError}</span>
          </div>
        )}

        <textarea
          className="min-h-[72px] w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-mc-blue-500"
          placeholder="Justification manuelle si correction ou incertitude terrain…"
          value={manualCorrectionReason}
          onChange={(event) => setManualCorrectionReason(event.target.value)}
        />
      </Card>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center flex-1">
            <button
              onClick={() => setCurrentStep(step.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                i === stepIndex
                  ? 'bg-[image:var(--gradient-brand)] text-white'
                  : i < stepIndex
                    ? 'text-mc-green-500 bg-mc-green-50 dark:bg-mc-green-900/30'
                    : 'text-[var(--text-muted)] bg-[var(--bg-tertiary)]'
              }`}
            >
              <step.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 rounded ${i < stepIndex ? 'bg-mc-green-300' : 'bg-[var(--border-default)]'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
        >
          {/* ── Identification ── */}
          {currentStep === 'identification' && (
            <div className="space-y-3">
              <Card gradient className="space-y-3">
                <CardHeader>
                  <CardTitle>Patient identifié</CardTitle>
                  <Badge variant="green" dot>eID vérifié</Badge>
                </CardHeader>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-[10px] text-[var(--text-muted)]">Nom</span><p className="font-medium">{patient.firstName} {patient.lastName}</p></div>
                  <div><span className="text-[10px] text-[var(--text-muted)]">NISS</span><p className="font-mono font-medium">{patient.niss}</p></div>
                  <div><span className="text-[10px] text-[var(--text-muted)]">Katz</span><p className="font-medium">{patient.katzCategory ?? 'N/A'}</p></div>
                  <div><span className="text-[10px] text-[var(--text-muted)]">Médecin</span><p className="font-medium">{patient.prescribingDoctor}</p></div>
                </div>
                {patient.allergies.length > 0 && (
                  <div className="p-2 rounded-lg bg-mc-red-50 dark:bg-red-900/20 border border-mc-red-200 dark:border-red-800">
                    <p className="text-xs font-semibold text-mc-red-600">⚠ Allergies: {patient.allergies.join(', ')}</p>
                  </div>
                )}
              </Card>
              <SmartVisitBriefingCard patientRouteId={patient.id} />
            </div>
          )}

          {/* ── Vitals ── */}
          {currentStep === 'vitals' && (
            <Card className="space-y-3">
              <CardHeader>
                <CardTitle>Paramètres vitaux</CardTitle>
              </CardHeader>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Systolique" placeholder="120" icon={<Heart className="h-4 w-4" />} value={vitals.systolic} onChange={(e) => setVitals(v => ({...v, systolic: e.target.value}))} hint="mmHg" />
                <Input label="Diastolique" placeholder="80" icon={<Heart className="h-4 w-4" />} value={vitals.diastolic} onChange={(e) => setVitals(v => ({...v, diastolic: e.target.value}))} hint="mmHg" />
                <Input label="Pouls" placeholder="72" icon={<Activity className="h-4 w-4" />} value={vitals.heartRate} onChange={(e) => setVitals(v => ({...v, heartRate: e.target.value}))} hint="bpm" />
                <Input label="Température" placeholder="36.8" icon={<Thermometer className="h-4 w-4" />} value={vitals.temperature} onChange={(e) => setVitals(v => ({...v, temperature: e.target.value}))} hint="°C" />
                <Input label="SpO₂" placeholder="98" icon={<Droplets className="h-4 w-4" />} value={vitals.spo2} onChange={(e) => setVitals(v => ({...v, spo2: e.target.value}))} hint="%" />
                <Input label="Glycémie" placeholder="110" icon={<Droplets className="h-4 w-4" />} value={vitals.glycemia} onChange={(e) => setVitals(v => ({...v, glycemia: e.target.value}))} hint="mg/dL" />
                <Input label="Poids" placeholder="72" icon={<Weight className="h-4 w-4" />} value={vitals.weight} onChange={(e) => setVitals(v => ({...v, weight: e.target.value}))} hint="kg" />
                <Input label="Douleur (EVA)" placeholder="0-10" icon={<PenLine className="h-4 w-4" />} value={vitals.pain} onChange={(e) => setVitals(v => ({...v, pain: e.target.value}))} hint="/10" />
              </div>
            </Card>
          )}

          {/* ── Acts ── */}
          {currentStep === 'acts' && (
            <Card className="space-y-3">
              <CardHeader>
                <CardTitle>Actes prestés</CardTitle>
                <Badge variant="blue">{selectedActs.length} acte(s) — {totalW.toFixed(2)} W</Badge>
              </CardHeader>
              <div className="space-y-1.5">
                {availableActs.map((act) => {
                  const selected = selectedActs.includes(act.code);
                  return (
                    <button
                      key={act.code}
                      onClick={() => setSelectedActs(prev =>
                        selected ? prev.filter(c => c !== act.code) : [...prev, act.code]
                      )}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all ${
                        selected
                          ? 'bg-mc-blue-50 dark:bg-mc-blue-900/20 border border-mc-blue-300 dark:border-mc-blue-700'
                          : 'bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-default)]'
                      }`}
                    >
                      <div className={`h-5 w-5 rounded-md flex items-center justify-center ${selected ? 'bg-mc-blue-500 text-white' : 'border border-[var(--border-default)]'}`}>
                        {selected && <CheckCircle className="h-3.5 w-3.5" />}
                      </div>
                      <span className="flex-1 text-left font-medium">{act.label}</span>
                      <span className="text-xs text-[var(--text-muted)] font-mono">{act.code}</span>
                      <span className="text-xs text-mc-blue-500 font-semibold">{act.valueW}W</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {/* ── Notes ── */}
          {currentStep === 'notes' && (
            <Card className="space-y-3">
              <CardHeader>
                <CardTitle>Notes & observations</CardTitle>
                <button
                  onClick={() => voice.isRecording ? voice.stop() : (voice.reset(), voice.start())}
                  disabled={!voice.isSupported}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    disabled:opacity-40 disabled:cursor-not-allowed ${
                    voice.isRecording
                      ? 'bg-mc-red-500 text-white animate-pulse'
                      : 'bg-mc-blue-500/10 text-mc-blue-500 hover:bg-mc-blue-500/20'
                  }`}
                >
                  {voice.isRecording ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  {voice.isRecording ? 'Arrêter' : 'Dicter'}
                </button>
              </CardHeader>
              {voice.isRecording && (
                <div className="flex flex-col gap-1 p-2 rounded-lg bg-mc-red-500/10 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-mc-red-500 animate-pulse" />
                    <span className="text-mc-red-600">Enregistrement en cours — parlez maintenant…</span>
                  </div>
                  {voice.interimTranscript && (
                    <p className="text-xs italic text-[var(--text-muted)] pl-4">{voice.interimTranscript}…</p>
                  )}
                </div>
              )}
              <textarea
                className="w-full h-40 px-3 py-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-default)] text-sm resize-none focus:outline-none focus:border-mc-blue-500 transition-colors"
                placeholder="Observations cliniques, évolution, consignes… ou utilisez le bouton Dicter"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4" />
                  Photo
                </Button>
                <Button variant="outline" size="sm" onClick={() => setBarcodeResult('CNK 2345678 — Metformine Sandoz 850mg')}>
                  <ScanBarcode className="h-4 w-4" />
                  Scanner médicament
                </Button>
              </div>
              {barcodeResult && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-mc-green-500/10 text-sm">
                  <CheckCircle className="h-4 w-4 text-mc-green-500" />
                  <span>Scanné: {barcodeResult}</span>
                  <button onClick={() => setBarcodeResult(null)} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
                </div>
              )}
            </Card>
          )}

          {/* ── Summary ── */}
          {currentStep === 'summary' && (
            <div className="space-y-3">
              <Card gradient>
                <CardHeader>
                  <CardTitle>Résumé de la visite</CardTitle>
                </CardHeader>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Durée</span><span className="font-mono font-bold">{formatTime(timer)}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Actes</span><span className="font-bold">{selectedActs.length}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Valeur W</span><span className="font-bold text-mc-blue-500">{totalW.toFixed(2)} W</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Montant estimé</span><span className="font-bold text-mc-green-500">€{(totalW * 7.25).toFixed(2)}</span></div>
                </div>
              </Card>

              {/* Signature area */}
              <Card>
                <CardHeader>
                  <CardTitle>Signature patient</CardTitle>
                </CardHeader>
                <div className="h-32 rounded-xl border-2 border-dashed border-[var(--border-default)] flex items-center justify-center">
                  <p className="text-sm text-[var(--text-muted)]">Signature confirmée à l’étape suivante</p>
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {submitError && (
        <Card className="border-mc-red-200 dark:border-red-800 bg-mc-red-50/70 dark:bg-red-900/10">
          <p className="text-sm text-mc-red-600 dark:text-red-300">{submitError}</p>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        {stepIndex > 0 && (
          <Button variant="outline" onClick={goPrev} className="flex-1">
            Précédent
          </Button>
        )}
        {stepIndex < steps.length - 1 ? (
          <Button variant="gradient" onClick={() => { if (!timerRunning && stepIndex === 0) setTimerRunning(true); goNext(); }} className="flex-1">
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="gradient"
            className="flex-1"
            disabled={saveVisitMutation.isPending}
            onClick={() => { void handleCompleteVisit(); }}
          >
            <CheckCircle className="h-4 w-4" />
            {saveVisitMutation.isPending ? 'Enregistrement...' : 'Valider la visite'}
          </Button>
        )}
      </div>
    </AnimatedPage>
  );
}
