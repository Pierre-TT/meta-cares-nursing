import { useState } from 'react';
import { Calendar, Plus, Sun, Moon, CloudSun, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, AnimatedPage, GradientHeader, ContentTabs } from '@/design-system';

type SlotStatus = 'available' | 'unavailable' | 'partial';
type AbsenceType = 'vacances' | 'maladie' | 'formation' | 'personnel';
type AbsenceStatus = 'demandé' | 'approuvé' | 'refusé';

interface DaySlot {
  day: string;
  shortDay: string;
  date: string;
  morning: SlotStatus;
  afternoon: SlotStatus;
  evening: SlotStatus;
  visits: number;
}

interface AbsenceRequest {
  id: string;
  type: AbsenceType;
  startDate: string;
  endDate: string;
  status: AbsenceStatus;
  reason: string;
  submittedDate: string;
}

const weekSlots: DaySlot[] = [
  { day: 'Lundi', shortDay: 'Lun', date: '03/03', morning: 'available', afternoon: 'available', evening: 'unavailable', visits: 8 },
  { day: 'Mardi', shortDay: 'Mar', date: '04/03', morning: 'available', afternoon: 'available', evening: 'unavailable', visits: 7 },
  { day: 'Mercredi', shortDay: 'Mer', date: '05/03', morning: 'available', afternoon: 'partial', evening: 'unavailable', visits: 9 },
  { day: 'Jeudi', shortDay: 'Jeu', date: '06/03', morning: 'available', afternoon: 'available', evening: 'unavailable', visits: 6 },
  { day: 'Vendredi', shortDay: 'Ven', date: '07/03', morning: 'available', afternoon: 'available', evening: 'unavailable', visits: 8 },
  { day: 'Samedi', shortDay: 'Sam', date: '08/03', morning: 'partial', afternoon: 'unavailable', evening: 'unavailable', visits: 3 },
  { day: 'Dimanche', shortDay: 'Dim', date: '09/03', morning: 'unavailable', afternoon: 'unavailable', evening: 'unavailable', visits: 0 },
];

const absences: AbsenceRequest[] = [
  { id: '1', type: 'vacances', startDate: '20/03/2025', endDate: '22/03/2025', status: 'approuvé', reason: 'Congé annuel', submittedDate: '01/03/2025' },
  { id: '2', type: 'formation', startDate: '10/04/2025', endDate: '10/04/2025', status: 'demandé', reason: 'Formation BelRAI avancée — Bruxelles', submittedDate: '05/03/2025' },
  { id: '3', type: 'maladie', startDate: '15/02/2025', endDate: '16/02/2025', status: 'approuvé', reason: 'Certificat médical', submittedDate: '15/02/2025' },
  { id: '4', type: 'personnel', startDate: '28/03/2025', endDate: '28/03/2025', status: 'refusé', reason: 'Raison personnelle — effectif insuffisant', submittedDate: '03/03/2025' },
];

const slotColors: Record<SlotStatus, string> = {
  available: 'bg-mc-green-500',
  partial: 'bg-mc-amber-500',
  unavailable: 'bg-[var(--bg-tertiary)]',
};

const absenceTypeConfig: Record<AbsenceType, { label: string; color: string }> = {
  vacances: { label: '🏖 Vacances', color: 'blue' },
  maladie: { label: '🤒 Maladie', color: 'red' },
  formation: { label: '📚 Formation', color: 'green' },
  personnel: { label: '👤 Personnel', color: 'amber' },
};

const absenceStatusConfig: Record<AbsenceStatus, { variant: 'green' | 'amber' | 'red' }> = {
  approuvé: { variant: 'green' },
  demandé: { variant: 'amber' },
  refusé: { variant: 'red' },
};

export function ScheduleAvailabilityPage() {
  const [showForm, setShowForm] = useState(false);

  const workedDays = weekSlots.filter(d => d.visits > 0).length;
  const totalVisits = weekSlots.reduce((s, d) => s + d.visits, 0);
  const nextAbsence = absences.find(a => a.status === 'approuvé');

  const scheduleTab = (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button className="h-8 w-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">Semaine du 03/03 — 09/03</span>
        <button className="h-8 w-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Header row */}
      <Card>
        <div className="grid grid-cols-[80px_1fr_1fr_1fr_40px] gap-2 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
          <span />
          <span className="flex items-center gap-1"><Sun className="h-3 w-3" /> Matin</span>
          <span className="flex items-center gap-1"><CloudSun className="h-3 w-3" /> Après-midi</span>
          <span className="flex items-center gap-1"><Moon className="h-3 w-3" /> Soir</span>
          <span className="text-center">#</span>
        </div>

        <div className="space-y-1.5">
          {weekSlots.map(day => (
            <div key={day.date} className="grid grid-cols-[80px_1fr_1fr_1fr_40px] gap-2 items-center">
              <div>
                <p className="text-xs font-semibold">{day.shortDay}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{day.date}</p>
              </div>
              {(['morning', 'afternoon', 'evening'] as const).map(slot => (
                <button
                  key={slot}
                  className={`h-8 rounded-lg transition-colors ${slotColors[day[slot]]} ${day[slot] === 'available' ? 'text-white' : day[slot] === 'partial' ? 'text-white' : 'text-[var(--text-muted)]'}`}
                >
                  <span className="text-[10px] font-medium">
                    {day[slot] === 'available' ? '✓' : day[slot] === 'partial' ? '~' : '—'}
                  </span>
                </button>
              ))}
              <span className="text-center text-xs font-bold">{day.visits || '—'}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-mc-green-500" /> Disponible</span>
          <span className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-mc-amber-500" /> Partiel</span>
          <span className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-[var(--bg-tertiary)] border border-[var(--border-default)]" /> Indisponible</span>
        </div>
      </Card>
    </div>
  );

  const absencesTab = (
    <div className="space-y-3">
      <Button variant="gradient" size="sm" className="w-full gap-1" onClick={() => setShowForm(!showForm)}>
        <Plus className="h-3.5 w-3.5" /> Demander une absence
      </Button>

      {showForm && (
        <Card className="border-mc-blue-200 dark:border-mc-blue-800 space-y-3">
          <CardHeader><CardTitle>Nouvelle demande</CardTitle></CardHeader>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)]">Type</label>
            <div className="flex gap-2 mt-1">
              {(Object.entries(absenceTypeConfig) as [AbsenceType, { label: string }][]).map(([key, cfg]) => (
                <button key={key} className="flex-1 py-2 rounded-lg text-[10px] font-medium bg-[var(--bg-tertiary)] hover:ring-2 hover:ring-mc-blue-500/20">
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Date début</label>
              <input type="date" className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Date fin</label>
              <input type="date" className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)]">Motif</label>
            <textarea className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm resize-none" rows={2} placeholder="Raison de l'absence..." />
          </div>
          <Button variant="gradient" className="w-full">Soumettre la demande</Button>
        </Card>
      )}

      {absences.map(a => {
        const typeCfg = absenceTypeConfig[a.type];
        const statusCfg = absenceStatusConfig[a.status];
        return (
          <Card key={a.id} className={a.status === 'refusé' ? 'opacity-60' : ''}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{typeCfg.label}</span>
                  <Badge variant={statusCfg.variant}>{a.status}</Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <Calendar className="h-3 w-3" />
                  <span>{a.startDate}{a.startDate !== a.endDate ? ` → ${a.endDate}` : ''}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{a.reason}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Soumis le {a.submittedDate}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  const tabs = [
    { id: 'schedule', label: 'Disponibilités', content: scheduleTab },
    { id: 'absences', label: `Absences (${absences.length})`, content: absencesTab },
  ];

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<Calendar className="h-5 w-5" />}
        title="Planning & Disponibilités"
        subtitle="Gestion des horaires"
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{workedDays}</p>
            <p className="text-[10px] text-white/60">Jours cette sem.</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{totalVisits}</p>
            <p className="text-[10px] text-white/60">Visites prévues</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{nextAbsence ? nextAbsence.startDate.slice(0, 5) : '—'}</p>
            <p className="text-[10px] text-white/60">Prochain congé</p>
          </div>
        </div>
      </GradientHeader>

      <ContentTabs tabs={tabs} />
    </AnimatedPage>
  );
}
