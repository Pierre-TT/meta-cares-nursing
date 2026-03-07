import { useMemo, useState, type FormEvent } from 'react';
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  ListTodo,
  Stethoscope,
  Thermometer,
} from 'lucide-react';
import { AnimatedPage, Badge, Button, Card, EmptyState, GradientHeader, Input } from '@/design-system';
import {
  useCompleteHadTask,
  useHadEpisodes,
  useHadPatientTasksToday,
  useInsertHadMeasurement,
} from '@/hooks/useHadData';
import { useAuthStore } from '@/stores/authStore';
type BadgeVariant = 'default' | 'blue' | 'green' | 'amber' | 'red' | 'outline';

const selectClassName =
  'w-full h-10 px-3 rounded-[0.625rem] text-sm bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-mc-blue-500/40 focus:border-mc-blue-500';

const measurementUnitDefaults = {
  temperature: '°C',
  heart_rate: 'bpm',
  oxygen_saturation: '%',
  weight: 'kg',
  glycemia: 'mg/dL',
  pain: '/10',
} as const;

function getTaskTypeVariant(taskType: string): BadgeVariant {
  switch (taskType) {
    case 'medication':
      return 'blue';
    case 'measurement':
      return 'green';
    case 'call':
      return 'amber';
    default:
      return 'outline';
  }
}

export function HospitalModePage() {
  const user = useAuthStore((state) => state.user);
  const { data: openEpisodes = [] } = useHadEpisodes({ onlyOpen: true });
  const { data: tasks = [], isLoading } = useHadPatientTasksToday();
  const completeTask = useCompleteHadTask();
  const insertMeasurement = useInsertHadMeasurement();
  const [measurementType, setMeasurementType] =
    useState<keyof typeof measurementUnitDefaults>('temperature');
  const [measurementValue, setMeasurementValue] = useState('');
  const [measurementUnit, setMeasurementUnit] = useState<string>(measurementUnitDefaults.temperature);
  const openEpisode = openEpisodes[0];

  const groupedTasks = useMemo(() => {
    return tasks.reduce<Record<string, typeof tasks>>((groups, task) => {
      const key = task.episodeReference ?? 'Episode HAD';
      groups[key] = groups[key] ? [...groups[key], task] : [task];
      return groups;
    }, {});
  }, [tasks]);

  async function handleInsertMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!openEpisode) {
      return;
    }

    await insertMeasurement.mutateAsync({
      episodeId: openEpisode.id,
      capturedByProfileId: user?.id,
      source: 'patient',
      measurementType,
      valueNumeric: measurementValue ? Number(measurementValue) : undefined,
      unit: measurementUnit,
      thresholdState: 'ok',
    });

    setMeasurementValue('');
  }

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<HeartPulse className="h-5 w-5" />}
        title="Mode hôpital à domicile"
        subtitle="Vos actions HAD prévues aujourd’hui"
        badge={
          <Badge variant="blue">
            {openEpisode ? openEpisode.reference : `${tasks.length} tâche${tasks.length > 1 ? 's' : ''}`}
          </Badge>
        }
      >
        <div className="grid grid-cols-3 gap-3 mt-2">
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-center">
            <p className="text-lg font-bold text-white">{tasks.length}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/70">à faire</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-center">
            <p className="text-lg font-bold text-white">{Object.keys(groupedTasks).length}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/70">épisodes</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-center">
            <p className="text-lg font-bold text-white">{openEpisode?.status ?? '—'}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/70">statut</p>
          </div>
        </div>
      </GradientHeader>

      {openEpisode && (
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="blue">{openEpisode.episodeType}</Badge>
            <Badge
              variant={
                openEpisode.riskLevel === 'critical' || openEpisode.riskLevel === 'high'
                  ? 'red'
                  : openEpisode.riskLevel === 'moderate'
                    ? 'amber'
                    : 'green'
              }
            >
              {openEpisode.riskLevel}
            </Badge>
            <Badge variant="outline">{openEpisode.status}</Badge>
          </div>

          <div>
            <p className="text-base font-semibold">{openEpisode.diagnosisSummary}</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{openEpisode.admissionReason}</p>
          </div>

          <div className="grid gap-2 text-xs text-[var(--text-muted)]">
            <p className="inline-flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-mc-blue-500" />
              {openEpisode.hospital.name}
              {openEpisode.hospital.service ? ` · ${openEpisode.hospital.service}` : ''}
            </p>
            <p className="inline-flex items-center gap-2">
              <Stethoscope className="h-3.5 w-3.5 text-mc-green-500" />
              Référent infirmier : {openEpisode.primaryNurse?.fullName ?? 'équipe HAD'}
            </p>
            {openEpisode.lastRoundAt && (
              <p className="inline-flex items-center gap-2">
                <HeartPulse className="h-3.5 w-3.5 text-mc-amber-500" />
                Dernière ronde : {new Date(openEpisode.lastRoundAt).toLocaleString('fr-BE')}
              </p>
            )}
          </div>
        </Card>
      )}

      {openEpisode && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Thermometer className="h-4 w-4 text-mc-amber-500" />
            <h2 className="text-sm font-semibold">Envoyer mes constantes</h2>
          </div>
          <form className="space-y-3" onSubmit={handleInsertMeasurement}>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--text-secondary)]">Mesure</label>
              <select
                className={selectClassName}
                value={measurementType}
                onChange={(event) => {
                  const nextType = event.target.value as keyof typeof measurementUnitDefaults;
                  setMeasurementType(nextType);
                  setMeasurementUnit(measurementUnitDefaults[nextType]);
                }}
              >
                <option value="temperature">temperature</option>
                <option value="heart_rate">heart_rate</option>
                <option value="oxygen_saturation">oxygen_saturation</option>
                <option value="weight">weight</option>
                <option value="glycemia">glycemia</option>
                <option value="pain">pain</option>
              </select>
            </div>

            <div className="grid grid-cols-[1fr,110px] gap-3">
              <Input
                label="Valeur"
                type="number"
                step="0.1"
                value={measurementValue}
                onChange={(event) => setMeasurementValue(event.target.value)}
                required
              />
              <Input
                label="Unité"
                value={measurementUnit}
                onChange={(event) => setMeasurementUnit(event.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={insertMeasurement.isPending}
              icon={<Thermometer className="h-4 w-4" />}
            >
              Envoyer la mesure
            </Button>
          </form>
        </Card>
      )}

      {!isLoading && tasks.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList className="h-6 w-6" />}
            title={openEpisode ? 'Aucune tâche HAD aujourd’hui' : 'Aucune activité HAD aujourd’hui'}
            description={
              openEpisode
                ? 'Votre épisode reste visible ci-dessus. Les rappels et tâches patients apparaîtront ici dès qu’ils seront planifiés.'
                : 'Votre équipe ajoutera ici l’épisode, les mesures et les rappels liés à votre prise en charge.'
            }
          />
        </Card>
      ) : (
        Object.entries(groupedTasks).map(([episodeReference, episodeTasks]) => (
          <Card key={episodeReference} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-mc-blue-500" />
                <p className="text-sm font-semibold">{episodeReference}</p>
              </div>
              <Badge variant="outline">{episodeTasks.length} tâche{episodeTasks.length > 1 ? 's' : ''}</Badge>
            </div>

            <div className="space-y-2">
              {episodeTasks.map((task) => (
                <div key={task.id} className="rounded-2xl bg-[var(--bg-tertiary)] p-3">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant={getTaskTypeVariant(task.taskType)}>{task.taskType}</Badge>
                    {task.dueAt && <Badge variant="outline">{new Date(task.dueAt).toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' })}</Badge>}
                  </div>
                  <p className="text-sm font-medium">{task.title}</p>
                  {task.description && <p className="text-xs text-[var(--text-muted)] mt-1">{task.description}</p>}
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={completeTask.isPending}
                      icon={<CheckCircle2 className="h-4 w-4" />}
                      onClick={() =>
                        completeTask.mutate({
                          taskId: task.id,
                          completedByProfileId: user?.id,
                        })
                      }
                    >
                      Marquer comme fait
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))
      )}
    </AnimatedPage>
  );
}
