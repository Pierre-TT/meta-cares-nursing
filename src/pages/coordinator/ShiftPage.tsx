import { useState } from 'react';
import { Clock, Sun, Moon, Sunrise, Plus, ChevronRight } from 'lucide-react';
import { Card, Badge, Button, AnimatedPage, GradientHeader } from '@/design-system';

const mockShifts = [
  { id: 's1', nurse: 'Marie Laurent', shift: 'morning' as const, start: '06:30', end: '14:00', patients: 8, status: 'active' as const },
  { id: 's2', nurse: 'Sophie Dupuis', shift: 'morning' as const, start: '07:00', end: '14:30', patients: 6, status: 'active' as const },
  { id: 's3', nurse: 'Thomas Maes', shift: 'afternoon' as const, start: '13:30', end: '21:00', patients: 7, status: 'upcoming' as const },
  { id: 's4', nurse: 'Laura Van Damme', shift: 'afternoon' as const, start: '14:00', end: '21:30', patients: 5, status: 'upcoming' as const },
  { id: 's5', nurse: 'Jean Peeters', shift: 'night' as const, start: '21:00', end: '06:30', patients: 3, status: 'upcoming' as const },
];

const shiftIcons = { morning: Sun, afternoon: Sunrise, night: Moon };
const shiftLabels = { morning: 'Matin', afternoon: 'Après-midi', night: 'Nuit' };
const shiftColors = {
  morning: 'text-mc-amber-500 bg-mc-amber-50 dark:bg-amber-900/30',
  afternoon: 'text-mc-blue-500 bg-mc-blue-50 dark:bg-mc-blue-900/30',
  night: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30',
};

export function ShiftPage() {
  const [selectedShift, setSelectedShift] = useState<'all' | 'morning' | 'afternoon' | 'night'>('all');
  const filtered = selectedShift === 'all' ? mockShifts : mockShifts.filter(s => s.shift === selectedShift);
  const activeCount = mockShifts.filter(s => s.status === 'active').length;

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Clock className="h-5 w-5" />}
        title="Gestion des Shifts"
        subtitle="Planning des gardes"
        badge={<Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10"><Plus className="h-3.5 w-3.5" />Nouveau</Button>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{activeCount}</p>
            <p className="text-[10px] text-white/60">En cours</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{mockShifts.length}</p>
            <p className="text-[10px] text-white/60">Total shifts</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{mockShifts.reduce((s, sh) => s + sh.patients, 0)}</p>
            <p className="text-[10px] text-white/60">Patients</p>
          </div>
        </div>
      </GradientHeader>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {([['all', 'Tous'], ['morning', 'Matin'], ['afternoon', 'Après-midi'], ['night', 'Nuit']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setSelectedShift(v)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${selectedShift === v ? 'bg-[image:var(--gradient-brand)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
          >{l}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(shift => {
          const Icon = shiftIcons[shift.shift];
          return (
            <Card key={shift.id} hover padding="sm" className="cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${shiftColors[shift.shift]}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{shift.nurse}</p>
                    <Badge variant={shift.status === 'active' ? 'green' : 'outline'}>
                      {shift.status === 'active' ? 'En cours' : 'À venir'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {shiftLabels[shift.shift]} • {shift.start}–{shift.end} • {shift.patients} patients
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
              </div>
            </Card>
          );
        })}
      </div>
      {/* Swap requests */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold">Demandes d'échange</span>
          <Badge variant="amber">1 en attente</Badge>
        </div>
        <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-tertiary)]">
          <div className="flex-1">
            <p className="text-xs font-medium">Thomas Maes ↔ Laura Van Damme</p>
            <p className="text-[10px] text-[var(--text-muted)]">Shift 07/03 après-midi — raison personnelle</p>
          </div>
          <Button variant="outline" size="sm">Approuver</Button>
        </div>
      </Card>

      {/* Overtime warnings */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-mc-amber-50 dark:bg-amber-900/20 border border-mc-amber-200 dark:border-amber-800">
        <Clock className="h-4 w-4 text-mc-amber-500" />
        <span className="text-xs font-medium text-mc-amber-600 dark:text-mc-amber-400">Sophie Dupuis: 2h supplémentaires cette semaine (38h atteint)</span>
      </div>
    </AnimatedPage>
  );
}
