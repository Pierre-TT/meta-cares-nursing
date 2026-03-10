import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { differenceInCalendarDays } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Camera,
  Plus,
  TrendingDown,
  TrendingUp,
  Minus,
  Calendar,
  Ruler,
  FileText,
  CheckCircle,
  Wifi,
  WifiOff,
  CloudUpload,
  AlertTriangle,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, Badge, ContentTabs, Input, AnimatedPage, GradientHeader } from '@/design-system';
import { useCreateNurseWoundAssessment, useNurseWoundAssessments } from '@/hooks/useNurseClinicalData';
import { useNursePatient } from '@/hooks/useNursePatients';
import { useOfflineClinicalSync } from '@/hooks/useOfflineClinicalSync';
import { enqueueOfflineWoundAssessment } from '@/lib/offlineClinicalSync';
import { useAuthStore } from '@/stores/authStore';

const woundTypes = [
  'Ulcère veineux', 'Ulcère artériel', 'Escarre (pression)',
  'Plaie chirurgicale', 'Plaie diabétique', 'Brûlure', 'Autre',
] as const;

const exudateLabels = {
  none: 'Aucun',
  mild: 'Faible',
  moderate: 'Modéré',
  heavy: 'Abondant',
} as const;

const tissueTypeLabels = {
  granulation: 'Granulation',
  slough: 'Fibrine',
  necrosis: 'Nécrose',
  epithelialization: 'Épithélialisation',
  mixed: 'Mixte',
  other: 'Autre',
} as const;

const bodyZones = [
  { id: 'head', label: 'Tête', x: 48, y: 8 },
  { id: 'chest', label: 'Thorax', x: 48, y: 25 },
  { id: 'abdomen', label: 'Abdomen', x: 48, y: 38 },
  { id: 'arm-l', label: 'Bras G', x: 25, y: 30 },
  { id: 'arm-r', label: 'Bras D', x: 71, y: 30 },
  { id: 'hand-l', label: 'Main G', x: 18, y: 45 },
  { id: 'hand-r', label: 'Main D', x: 78, y: 45 },
  { id: 'leg-l', label: 'Jambe G', x: 38, y: 62 },
  { id: 'leg-r', label: 'Jambe D', x: 58, y: 62 },
  { id: 'foot-l', label: 'Pied G', x: 38, y: 85 },
  { id: 'foot-r', label: 'Pied D', x: 58, y: 85 },
  { id: 'sacrum', label: 'Sacrum', x: 48, y: 50 },
];

function inferWoundZone(pathologies: string[]) {
  const text = pathologies.join(' ').toLowerCase();

  if (text.includes('sacrum')) return 'sacrum';
  if (text.includes('jambe gauche') || text.includes('jambe g')) return 'leg-l';
  if (text.includes('jambe droite') || text.includes('jambe d')) return 'leg-r';
  if (text.includes('pied gauche') || text.includes('pied g')) return 'foot-l';
  if (text.includes('pied droit') || text.includes('pied d')) return 'foot-r';
  if (text.includes('bras gauche') || text.includes('bras g')) return 'arm-l';
  if (text.includes('bras droit') || text.includes('bras d')) return 'arm-r';

  return 'leg-l';
}

function inferWoundType(label: string) {
  if (/escarre|pression/i.test(label)) return 'Escarre (pression)';
  if (/art[eé]riel/i.test(label)) return 'Ulcère artériel';
  if (/chirurgical/i.test(label)) return 'Plaie chirurgicale';
  if (/diab[eé]t/i.test(label)) return 'Plaie diabétique';
  if (/br[uû]lure/i.test(label)) return 'Brûlure';
  if (/ulc[eè]re/i.test(label)) return 'Ulcère veineux';
  return 'Autre';
}

function formatDimension(value?: number) {
  return typeof value === 'number' ? value.toFixed(1) : '—';
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('fr-BE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseDecimalInput(value: string) {
  const parsed = Number.parseFloat(value.replace(',', '.'));
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseIntegerInput(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function getArea(length?: number, width?: number) {
  if (length === undefined || width === undefined) {
    return null;
  }

  return length * width;
}

export function WoundCarePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: patient, isLoading, error, refetch } = useNursePatient(id);
  const {
    data: woundHistory = [],
    isLoading: isWoundLoading,
    error: woundError,
    refetch: refetchWoundHistory,
  } = useNurseWoundAssessments(patient?.databaseId);
  const saveAssessmentMutation = useCreateNurseWoundAssessment();
  const offlineSync = useOfflineClinicalSync(patient?.databaseId);
  const inferredZone = inferWoundZone(patient?.pathologies ?? []);
  const latestAssessment = woundHistory[0];
  const woundLabel =
    latestAssessment?.woundLabel
    ?? patient?.pathologies.find((entry) => /ulc[eè]re|plaie|escarre/i.test(entry))
    ?? 'Plaie en suivi';
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const activeZone = selectedZone ?? latestAssessment?.zoneId ?? inferredZone;
  const [woundDraft, setWoundDraft] = useState<Partial<{
    type: string;
    length: string;
    width: string;
    depth: string;
    exudate: string;
    tissueType: string;
    pain: string;
  }>>({});
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const woundForm = {
    type: woundDraft.type ?? latestAssessment?.woundType ?? inferWoundType(woundLabel),
    length: woundDraft.length ?? latestAssessment?.lengthCm?.toString() ?? '',
    width: woundDraft.width ?? latestAssessment?.widthCm?.toString() ?? '',
    depth: woundDraft.depth ?? latestAssessment?.depthCm?.toString() ?? '',
    exudate: woundDraft.exudate ?? latestAssessment?.exudateLevel ?? 'moderate',
    tissueType: woundDraft.tissueType ?? latestAssessment?.tissueType ?? 'granulation',
    pain: woundDraft.pain ?? latestAssessment?.pain?.toString() ?? '',
  };

  if (error) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-3">
        <h2 className="text-lg font-bold">Suivi de plaie indisponible</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Le patient lié à ce suivi n’a pas pu être chargé.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Réessayer
          </Button>
          <Button variant="outline" onClick={() => navigate('/nurse/patients')}>
            Retour aux patients
          </Button>
        </div>
      </AnimatedPage>
    );
  }

  if (isLoading) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <p className="text-sm text-[var(--text-muted)]">Chargement du suivi de plaie…</p>
      </AnimatedPage>
    );
  }

  if (woundError) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-3">
        <h2 className="text-lg font-bold">Historique de plaie indisponible</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Les évaluations persistées de cette plaie n’ont pas pu être chargées.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchWoundHistory()}>
            Réessayer
          </Button>
          <Button variant="outline" onClick={() => navigate('/nurse/patients')}>
            Retour aux patients
          </Button>
        </div>
      </AnimatedPage>
    );
  }

  if (isWoundLoading) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <p className="text-sm text-[var(--text-muted)]">Chargement du suivi de plaie…</p>
      </AnimatedPage>
    );
  }

  if (!patient) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-3">
        <h2 className="text-lg font-bold">Patient introuvable</h2>
        <Button variant="outline" onClick={() => navigate('/nurse/patients')}>
          Retour aux patients
        </Button>
      </AnimatedPage>
    );
  }

  const oldestAssessment = woundHistory[woundHistory.length - 1];
  const latestArea = getArea(latestAssessment?.lengthCm, latestAssessment?.widthCm);
  const oldestArea = getArea(oldestAssessment?.lengthCm, oldestAssessment?.widthCm);
  const healingDelta = latestArea !== null && oldestArea !== null && oldestArea > 0
    ? ((oldestArea - latestArea) / oldestArea) * 100
    : 0;
  const trackingDays = latestAssessment && oldestAssessment
    ? differenceInCalendarDays(new Date(latestAssessment.recordedAt), new Date(oldestAssessment.recordedAt)) + 1
    : 0;

  const handleSaveAssessment = async () => {
    if (!activeZone) {
      return;
    }

    const payload = {
      patientId: patient.databaseId,
      recordedByProfileId: user?.role === 'nurse' ? user.id : undefined,
      woundLabel,
      woundType: woundForm.type,
      zoneId: activeZone,
      lengthCm: parseDecimalInput(woundForm.length),
      widthCm: parseDecimalInput(woundForm.width),
      depthCm: parseDecimalInput(woundForm.depth),
      exudateLevel: woundForm.exudate,
      tissueType: woundForm.tissueType,
      pain: parseIntegerInput(woundForm.pain),
      metadata: {
        source: 'nurse_wound_page',
      },
      recordedAt: new Date().toISOString(),
    };

    if (!offlineSync.snapshot.online) {
      enqueueOfflineWoundAssessment(payload, {
        patientLabel: `${patient.lastName} ${patient.firstName}`.trim(),
      });
      offlineSync.refresh();
      setSyncFeedback('Evaluation de plaie enregistree hors ligne. Elle sera synchronisee des que la connexion reviendra.');
      return;
    }

    try {
      await saveAssessmentMutation.mutateAsync(payload);
      setSyncFeedback('Evaluation de plaie synchronisee.');
    } catch (error) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        enqueueOfflineWoundAssessment(payload, {
          patientLabel: `${patient.lastName} ${patient.firstName}`.trim(),
        });
        offlineSync.refresh();
        setSyncFeedback('Connexion perdue pendant l enregistrement. La mesure reste en file locale.');
        return;
      }

      setSyncFeedback(error instanceof Error ? error.message : null);
      // handled by mutation state below
    }
  };

  const handleSyncOfflineQueue = async () => {
    const result = await offlineSync.flushWoundQueue();

    if (result.syncedCount > 0) {
      await refetchWoundHistory();
    }

    if (result.syncedCount > 0 && result.failedCount === 0) {
      setSyncFeedback(`${result.syncedCount} evaluation(s) hors ligne synchronisee(s).`);
      return;
    }

    if (result.syncedCount > 0 || result.failedCount > 0) {
      setSyncFeedback(
        `${result.syncedCount} synchronisee(s), ${result.failedCount} encore en attente.`,
      );
    }
  };

  const tabs = [
    {
      label: 'Localisation',
      content: (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Zone anatomique</CardTitle></CardHeader>
            <div className="relative h-80 bg-[var(--bg-tertiary)] rounded-xl overflow-hidden">
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-20">
                <ellipse cx="48" cy="10" rx="8" ry="9" fill="currentColor" />
                <rect x="38" y="19" width="20" height="25" rx="4" fill="currentColor" />
                <rect x="20" y="20" width="18" height="6" rx="3" fill="currentColor" />
                <rect x="58" y="20" width="18" height="6" rx="3" fill="currentColor" />
                <rect x="38" y="44" width="9" height="30" rx="3" fill="currentColor" />
                <rect x="49" y="44" width="9" height="30" rx="3" fill="currentColor" />
              </svg>

              {bodyZones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
                >
                  <motion.div
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-bold transition-colors ${
                      activeZone === zone.id
                        ? 'bg-mc-red-500 text-white scale-125'
                        : 'bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-muted)]'
                    }`}
                    whileTap={{ scale: 0.9 }}
                  >
                    {activeZone === zone.id ? '✕' : '·'}
                  </motion.div>
                </button>
              ))}
            </div>
            {activeZone && (
              <p className="text-sm text-center mt-2">
                Zone sélectionnée: <strong>{bodyZones.find((zone) => zone.id === activeZone)?.label}</strong>
              </p>
            )}
          </Card>
        </div>
      ),
    },
    {
      label: 'Évaluation',
      content: (
        <Card className="space-y-4">
          <CardHeader><CardTitle>Évaluation de la plaie</CardTitle></CardHeader>
          <div>
            <p className="text-xs font-medium mb-2 text-[var(--text-muted)]">Type de plaie</p>
            <div className="flex flex-wrap gap-2">
              {woundTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setWoundDraft((form) => ({ ...form, type }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    woundForm.type === type
                      ? 'bg-mc-blue-500 text-white'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="Longueur" placeholder="cm" icon={<Ruler className="h-4 w-4" />} value={woundForm.length} onChange={(event) => setWoundDraft((form) => ({ ...form, length: event.target.value }))} />
            <Input label="Largeur" placeholder="cm" icon={<Ruler className="h-4 w-4" />} value={woundForm.width} onChange={(event) => setWoundDraft((form) => ({ ...form, width: event.target.value }))} />
            <Input label="Profondeur" placeholder="cm" icon={<Ruler className="h-4 w-4" />} value={woundForm.depth} onChange={(event) => setWoundDraft((form) => ({ ...form, depth: event.target.value }))} />
          </div>

          <div>
            <p className="text-xs font-medium mb-2 text-[var(--text-muted)]">Exsudat</p>
            <div className="flex gap-2">
              {Object.entries(exudateLabels).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setWoundDraft((form) => ({ ...form, exudate: value }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    woundForm.exudate === value
                      ? 'bg-mc-blue-500 text-white'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium mb-2 text-[var(--text-muted)]">Type tissulaire</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(tissueTypeLabels).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setWoundDraft((form) => ({ ...form, tissueType: value }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    woundForm.tissueType === value
                      ? 'bg-mc-blue-500 text-white'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Input label="Douleur (EVA)" placeholder="0-10" value={woundForm.pain} onChange={(event) => setWoundDraft((form) => ({ ...form, pain: event.target.value }))} hint="/10" />
        </Card>
      ),
    },
    {
      label: 'Photos',
      content: (
        <Card className="space-y-4">
          <CardHeader><CardTitle>Documentation photo</CardTitle></CardHeader>
          <div className="grid grid-cols-2 gap-3">
            <button className="h-32 rounded-xl border-2 border-dashed border-[var(--border-default)] flex flex-col items-center justify-center gap-2 hover:border-mc-blue-300 transition-colors">
              <Camera className="h-8 w-8 text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)]">Prendre une photo</span>
            </button>
            <button className="h-32 rounded-xl border-2 border-dashed border-[var(--border-default)] flex flex-col items-center justify-center gap-2 hover:border-mc-blue-300 transition-colors">
              <Plus className="h-8 w-8 text-[var(--text-muted)]" />
              <span className="text-xs text-[var(--text-muted)]">Importer</span>
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)] text-center">
            L&apos;IA analysera automatiquement les photos pour évaluer la cicatrisation
          </p>
        </Card>
      ),
    },
    {
      label: 'Évolution',
      content: (
        <div className="space-y-3">
          {woundHistory.length === 0 ? (
            <Card padding="sm">
              <p className="text-sm text-[var(--text-muted)]">Aucune évaluation de plaie n’a encore été enregistrée.</p>
            </Card>
          ) : woundHistory.map((entry, index) => {
            const currentArea = getArea(entry.lengthCm, entry.widthCm);
            const previousArea = getArea(woundHistory[index + 1]?.lengthCm, woundHistory[index + 1]?.widthCm);
            const trend =
              currentArea !== null && previousArea !== null
                ? currentArea < previousArea - 0.15
                  ? 'improving'
                  : currentArea > previousArea + 0.15
                    ? 'worsening'
                    : 'stable'
                : 'stable';

            return (
              <Card key={entry.id} padding="sm">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                    trend === 'improving' ? 'bg-mc-green-50 dark:bg-mc-green-900/30' :
                    trend === 'worsening' ? 'bg-mc-red-50 dark:bg-red-900/30' :
                    'bg-[var(--bg-tertiary)]'
                  }`}>
                    {trend === 'improving' ? <TrendingDown className="h-4 w-4 text-mc-green-500" /> :
                     trend === 'worsening' ? <TrendingUp className="h-4 w-4 text-mc-red-500" /> :
                     <Minus className="h-4 w-4 text-[var(--text-muted)]" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-[var(--text-muted)]" />
                      <span className="text-xs text-[var(--text-muted)]">{new Date(entry.recordedAt).toLocaleDateString('fr-BE')}</span>
                      <Badge variant={trend === 'improving' ? 'green' : trend === 'worsening' ? 'red' : 'outline'}>
                        {trend === 'improving' ? 'Amélioration' : trend === 'worsening' ? 'Aggravation' : 'Stable'}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mt-0.5">
                      {formatDimension(entry.lengthCm)} × {formatDimension(entry.widthCm)} cm • Prof. {formatDimension(entry.depthCm)} cm
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Exsudat: {exudateLabels[entry.exudateLevel as keyof typeof exudateLabels] ?? entry.exudateLevel}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ),
    },
  ];

  return (
    <AnimatedPage className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <GradientHeader
        icon={<Camera className="h-5 w-5" />}
        title="Soins de Plaie"
        subtitle={`${patient.lastName} ${patient.firstName} · ${woundLabel}`}
        badge={<Badge variant={woundHistory.length > 0 ? 'blue' : 'outline'}>{woundHistory.length > 0 ? `${woundHistory.length} éval.` : 'Historique vide'}</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">
              {formatDimension(latestAssessment?.lengthCm)}×{formatDimension(latestAssessment?.widthCm)}
            </p>
            <p className="text-[10px] text-white/60">cm (L×l)</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{trackingDays > 0 ? `J+${trackingDays}` : 'J+0'}</p>
            <p className="text-[10px] text-white/60">Depuis début</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">
              {healingDelta > 0 ? '↗' : healingDelta < 0 ? '↘' : '→'} {Math.abs(healingDelta).toFixed(0)}%
            </p>
            <p className="text-[10px] text-white/60">Cicatrisation</p>
          </div>
        </div>
      </GradientHeader>

      <Card glass className="border-l-4 border-l-mc-blue-500">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-mc-blue-500/20 flex items-center justify-center">
            <FileText className="h-5 w-5 text-mc-blue-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Dernière synthèse clinique</p>
              <Badge variant={latestAssessment ? 'green' : 'outline'}>{latestAssessment ? 'Persistée' : 'À initier'}</Badge>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {latestAssessment
                ? `${latestAssessment.woundType} · ${tissueTypeLabels[latestAssessment.tissueType as keyof typeof tissueTypeLabels] ?? latestAssessment.tissueType} · Exsudat ${exudateLabels[latestAssessment.exudateLevel as keyof typeof exudateLabels] ?? latestAssessment.exudateLevel}`
                : 'Aucune évaluation enregistrée. Sélectionnez une zone puis enregistrez la première mesure.'}
            </p>
          </div>
        </div>
      </Card>

      <Card className={offlineSync.snapshot.online ? 'border-l-4 border-l-mc-green-500' : 'border-l-4 border-l-mc-amber-500'}>
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${offlineSync.snapshot.online ? 'bg-mc-green-500/15' : 'bg-mc-amber-500/15'}`}>
              {offlineSync.snapshot.online ? (
                <Wifi className="h-5 w-5 text-mc-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-mc-amber-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold">
                  {offlineSync.snapshot.online ? 'Synchronisation de plaies active' : 'Mode hors ligne actif'}
                </p>
                <Badge variant={offlineSync.snapshot.woundEntries.length > 0 ? 'amber' : 'green'}>
                  {offlineSync.snapshot.woundEntries.length} en attente
                </Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {offlineSync.snapshot.online
                  ? offlineSync.snapshot.woundEntries.length > 0
                    ? 'Les evaluations locales peuvent maintenant etre poussees vers le dossier clinique.'
                    : 'Toutes les evaluations de plaie connues sont synchronisees.'
                  : 'Les nouvelles evaluations sont conservees localement avec horodatage, zone et mesures.'}
              </p>
            </div>
          </div>

          {offlineSync.snapshot.online && offlineSync.snapshot.woundEntries.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => void handleSyncOfflineQueue()} disabled={offlineSync.isSyncing}>
              <CloudUpload className="h-4 w-4" />
              Synchroniser
            </Button>
          )}
        </div>

        {offlineSync.snapshot.woundEntries.length > 0 && (
          <div className="mt-3 space-y-2">
            {offlineSync.snapshot.woundEntries.slice(0, 3).map((entry) => (
              <div key={entry.localId} className="rounded-xl bg-[var(--bg-secondary)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{entry.woundLabel}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {bodyZones.find((zone) => zone.id === entry.zoneId)?.label ?? entry.zoneId} · {formatDateTime(entry.recordedAt)}
                    </p>
                  </div>
                  <Badge variant={entry.retryCount > 0 ? 'red' : 'amber'}>
                    {entry.retryCount > 0 ? `Retry ${entry.retryCount}` : 'Local'}
                  </Badge>
                </div>
                {entry.lastError && (
                  <p className="text-[10px] text-mc-red-500 mt-1">{entry.lastError}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <ContentTabs tabs={tabs} />

      {syncFeedback && (
        <Card className="border-mc-blue-200 bg-mc-blue-500/5">
          <div className="flex items-start gap-3">
            <CloudUpload className="h-4 w-4 text-mc-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm">{syncFeedback}</p>
          </div>
        </Card>
      )}

      {saveAssessmentMutation.error && (
        <Card className="border-mc-red-200 dark:border-red-800 bg-mc-red-50/70 dark:bg-red-900/10">
          <p className="text-sm text-mc-red-600 dark:text-red-300">
            L evaluation de plaie n a pas pu etre enregistree.
          </p>
        </Card>
      )}

      {!offlineSync.snapshot.online && (
        <Card className="border border-mc-amber-500/20 bg-mc-amber-500/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-mc-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-[var(--text-secondary)]">
              Vous etes hors ligne. Le bouton d enregistrement ajoute l evaluation a la file locale avec reprise automatique au retour de connexion.
            </p>
          </div>
        </Card>
      )}

      <Button variant="gradient" size="lg" className="w-full" disabled={saveAssessmentMutation.isPending || offlineSync.isSyncing} onClick={() => { void handleSaveAssessment(); }}>
        <CheckCircle className="h-4 w-4" />
        {saveAssessmentMutation.isPending
          ? 'Enregistrement...'
          : offlineSync.snapshot.online
            ? 'Enregistrer l evaluation'
            : 'Enregistrer hors ligne'}
      </Button>
    </AnimatedPage>
  );
}
