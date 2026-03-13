import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  Heart,
  Droplets,
  Wind,
  Weight,
  Phone,
  MessageCircle,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Sparkles,
  Pill,
  ChevronRight,
} from 'lucide-react';
import { Card, Badge, Button, Avatar, AnimatedPage, GradientHeader } from '@/design-system';
import { useBelraiTwin } from '@/hooks/useBelraiTwin';
import { usePatientHomeData } from '@/hooks/usePlatformData';

const statusSteps = ['Préparation', 'En route', 'Arrivée prochaine', 'Sur place'];
const vitalToneMeta = {
  red: { icon: Heart, color: 'text-mc-red-500', bg: 'bg-mc-red-50 dark:bg-red-900/20' },
  amber: { icon: Droplets, color: 'text-mc-amber-500', bg: 'bg-mc-amber-50 dark:bg-amber-900/20' },
  green: { icon: Wind, color: 'text-mc-green-500', bg: 'bg-mc-green-50 dark:bg-mc-green-900/20' },
  blue: { icon: Weight, color: 'text-mc-blue-500', bg: 'bg-mc-blue-50 dark:bg-mc-blue-900/20' },
} as const;

interface MedicationReminder {
  id: string;
  name: string;
  time: string;
  status: 'taken' | 'due' | 'upcoming';
}

export function PatientHome() {
  const navigate = useNavigate();
  const { data } = usePatientHomeData();
  const { profile, nurseETA, timeline, vitals, healthTip, linkedPatientId } = data;
  const belraiQuery = useBelraiTwin(linkedPatientId ?? undefined);
  const belrai = belraiQuery.data;
  const officialBelrai = belrai?.officialResult ?? null;
  const hasSharedBelrai = Boolean(belrai?.sharedResultsReady && officialBelrai?.isSharedWithPatient);

  const activeStep = nurseETA.status === 'en_route' ? 1 : 0;
  const medicationStateKey = data.medReminders
    .map(({ id, name, time, status }) => `${id}:${name}:${time}:${status}`)
    .join('|');

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      {/* ── Gradient Header ── */}
      <GradientHeader
        icon={<Heart className="h-5 w-5" />}
        title={`Bonjour ${profile.firstName} 👋`}
        subtitle="Votre infirmière arrive bientôt"
        badge={<Badge variant="green" dot>{nurseETA.status === 'en_route' ? 'En route' : 'Préparation'}</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{nurseETA.eta} min</p>
            <p className="text-[10px] text-white/60">ETA</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{nurseETA.visits}</p>
            <p className="text-[10px] text-white/60">Soins prévus</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{data.medReminders.length}</p>
            <p className="text-[10px] text-white/60">Médicaments</p>
          </div>
        </div>
      </GradientHeader>

      {/* ── Live Nurse Tracker ── */}
      <Card gradient>
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <Avatar name={nurseETA.name} size="md" />
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-mc-green-500 border-2 border-white"
            />
          </div>
          <div className="flex-1">
            <p className="font-bold">{nurseETA.name}</p>
            <p className="text-xs text-[var(--text-muted)]">Infirmière attitrée</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-mc-blue-500">{nurseETA.eta}'</p>
            <p className="text-[10px] text-[var(--text-muted)]">estimation</p>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-1 mb-1">
          {statusSteps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= activeStep ? 'bg-mc-green-500' : 'bg-[var(--bg-tertiary)]'}`} />
          ))}
        </div>
        <div className="flex justify-between">
          {statusSteps.map((s, i) => (
            <span key={s} className={`text-[8px] ${i <= activeStep ? 'text-mc-green-500 font-medium' : 'text-[var(--text-muted)]'}`}>{s}</span>
          ))}
        </div>
      </Card>

      <Card className="border-l-4 border-l-mc-blue-500">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-mc-blue-50 dark:bg-mc-blue-900/20 flex items-center justify-center shrink-0">
              <Brain className="h-5 w-5 text-mc-blue-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold">Mon BelRAI</p>
                <Badge variant={hasSharedBelrai ? 'green' : 'amber'}>
                  {hasSharedBelrai ? 'Partagé' : 'En préparation'}
                </Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {hasSharedBelrai
                  ? `${officialBelrai?.caps.length ?? 0} priorité(s) et ${officialBelrai?.scores.length ?? 0} repère(s) sont disponibles dans votre vue citoyenne.`
                  : officialBelrai && !officialBelrai.isSharedWithPatient
                    ? 'Des résultats officiels sont déjà reçus, mais ils ne sont pas encore partagés dans votre portail.'
                    : linkedPatientId
                      ? 'Votre équipe prépare encore la synthèse. Les réponses détaillées restent masquées tant que le partage n’est pas finalisé.'
                      : 'Votre dossier BelRAI apparaîtra ici dès qu’il sera relié à votre portail patient.'}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="xs"
            onClick={() => navigate('/patient/belrai')}
            iconRight={<ArrowRight className="h-3.5 w-3.5" />}
          >
            Ouvrir
          </Button>
        </div>

        {hasSharedBelrai && officialBelrai && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="rounded-xl bg-[var(--bg-secondary)] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Katz</p>
              <p className="text-sm font-semibold mt-1">{officialBelrai.katz.category}</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-secondary)] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">CAPs</p>
              <p className="text-sm font-semibold mt-1">{officialBelrai.caps.length}</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-secondary)] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Partage</p>
              <p className="text-sm font-semibold mt-1">{officialBelrai.sharedLabel}</p>
            </div>
          </div>
        )}
      </Card>

      {/* ── Medication Reminders ── */}
      <div>
        <MedicationRemindersSection
          key={medicationStateKey}
          reminders={data.medReminders}
          onViewAll={() => navigate('/patient/treatments')}
        />
      </div>

      {/* ── Daily Timeline ── */}
      <Card>
        <p className="text-sm font-bold mb-3">Ma journée</p>
        <div className="relative pl-6 space-y-3">
          {/* Vertical line */}
          <div className="absolute left-[9px] top-1 bottom-1 w-px bg-[var(--border-default)]" />
          {timeline.map(ev => (
            <div key={ev.id} className="relative flex items-start gap-3">
              <div className="absolute left-[-24px] top-0.5">
                {ev.status === 'done' && <CheckCircle2 className="h-[18px] w-[18px] text-mc-green-500 bg-[var(--bg-primary)] rounded-full" />}
                {ev.status === 'current' && (
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <Circle className="h-[18px] w-[18px] text-mc-blue-500 fill-mc-blue-500 bg-[var(--bg-primary)] rounded-full" />
                  </motion.div>
                )}
                {ev.status === 'upcoming' && <Circle className="h-[18px] w-[18px] text-[var(--text-muted)] bg-[var(--bg-primary)] rounded-full" />}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-medium ${ev.status === 'done' ? 'text-[var(--text-muted)]' : ev.status === 'current' ? 'text-mc-blue-500 font-bold' : ''}`}>
                  {ev.label}
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">{ev.time}</p>
              </div>
              {ev.status === 'current' && <Badge variant="blue">En cours</Badge>}
            </div>
          ))}
        </div>
      </Card>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Phone, label: 'Appeler', color: 'text-mc-green-500', bg: 'bg-mc-green-50 dark:bg-mc-green-900/20', path: '/patient/more' },
          { icon: AlertTriangle, label: 'SOS', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', path: '/patient/more' },
          { icon: MessageCircle, label: 'Messages', color: 'text-mc-blue-500', bg: 'bg-mc-blue-50 dark:bg-mc-blue-900/20', path: '/patient/messages' },
          { icon: ClipboardList, label: 'Formulaires', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', path: '/patient/questionnaire' },
        ].map(a => (
          <button key={a.label} onClick={() => navigate(a.path)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors">
            <div className={`h-10 w-10 rounded-xl ${a.bg} flex items-center justify-center`}>
              <a.icon className={`h-5 w-5 ${a.color}`} />
            </div>
            <span className="text-[10px] font-medium">{a.label}</span>
          </button>
        ))}
      </div>

      {/* ── Health Summary Strip ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold">Ma santé</p>
          <button onClick={() => navigate('/patient/health')} className="text-xs text-mc-blue-500 font-medium flex items-center gap-0.5">
            Détails <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {vitals.map(v => (
            <button key={v.label} onClick={() => navigate('/patient/health')} className={`shrink-0 w-24 p-3 rounded-2xl ${vitalToneMeta[v.tone].bg} text-center`}>
              {(() => {
                const Icon = vitalToneMeta[v.tone].icon;
                return <Icon className={`h-5 w-5 mx-auto mb-1 ${vitalToneMeta[v.tone].color}`} />;
              })()}
              <p className="text-sm font-bold">{v.value}</p>
              <p className="text-[9px] text-[var(--text-muted)]">{v.unit}</p>
              <p className="text-[9px] font-medium mt-0.5">{v.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── AI Health Tip ── */}
      <Card className="bg-gradient-to-r from-mc-blue-500/5 to-mc-green-500/5 border border-mc-blue-500/20">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-mc-blue-500 to-mc-green-500 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold mb-0.5">💡 Conseil santé du jour</p>
            <p className="text-xs text-[var(--text-muted)]">
              {healthTip}
            </p>
          </div>
        </div>
      </Card>
    </AnimatedPage>
  );
}

function MedicationRemindersSection({
  reminders,
  onViewAll,
}: {
  reminders: MedicationReminder[];
  onViewAll: () => void;
}) {
  const [meds, setMeds] = useState(reminders);

  const markMed = (id: string, taken: boolean) => {
    setMeds((prev) => prev.map((med) => (
      med.id === id ? { ...med, status: taken ? 'taken' : 'due' } : med
    )));
  };

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold flex items-center gap-2"><Pill className="h-4 w-4 text-mc-blue-500" /> Rappels médicaments</p>
        <button onClick={onViewAll} className="text-xs text-mc-blue-500 font-medium">Voir tout</button>
      </div>
      <div className="space-y-2">
        {meds.map((med) => (
          <Card key={med.id} padding="sm">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                med.status === 'taken' ? 'bg-mc-green-50 dark:bg-mc-green-900/20' :
                med.status === 'due' ? 'bg-mc-amber-50 dark:bg-amber-900/20' :
                'bg-[var(--bg-tertiary)]'
              }`}>
                {med.status === 'taken' ? <CheckCircle2 className="h-4 w-4 text-mc-green-500" /> : <Pill className="h-4 w-4 text-mc-amber-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${med.status === 'taken' ? 'line-through text-[var(--text-muted)]' : ''}`}>{med.name}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{med.time}</p>
              </div>
              {med.status === 'due' && (
                <Button variant="primary" size="sm" onClick={() => markMed(med.id, true)}>Pris ✓</Button>
              )}
              {med.status === 'taken' && <Badge variant="green">Pris</Badge>}
              {med.status === 'upcoming' && <Badge variant="outline">{med.time}</Badge>}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
