import { CalendarOff, UserPlus, AlertTriangle, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Avatar, Button, AnimatedPage, GradientHeader } from '@/design-system';

const absences = [
  { id: 'a1', nurse: 'Kevin Peeters', type: 'maladie' as const, start: '06/03/2026', end: '08/03/2026', days: 3, replacement: 'Thomas Maes', status: 'covered' as const },
  { id: 'a2', nurse: 'Sophie Dupuis', type: 'congé' as const, start: '10/03/2026', end: '14/03/2026', days: 5, replacement: null, status: 'uncovered' as const },
  { id: 'a3', nurse: 'Marie Laurent', type: 'formation' as const, start: '12/03/2026', end: '12/03/2026', days: 1, replacement: 'Laura Van Damme', status: 'covered' as const },
];

const leaveBalances = [
  { nurse: 'Marie Laurent', legal: 14, taken: 8, sick: 2, recovery: 1 },
  { nurse: 'Sophie Dupuis', legal: 14, taken: 10, sick: 4, recovery: 2 },
  { nurse: 'Thomas Maes', legal: 14, taken: 6, sick: 1, recovery: 0 },
  { nurse: 'Laura Van Damme', legal: 14, taken: 9, sick: 3, recovery: 1 },
  { nurse: 'Kevin Peeters', legal: 14, taken: 5, sick: 8, recovery: 0 },
];

const replacementSuggestions = [
  { nurse: 'Thomas Maes', reason: 'Même zone (Uccle adj.), spécialité compatible, disponible', score: 95 },
  { nurse: 'Laura Van Damme', reason: 'Zone proche, 3 patients en commun', score: 78 },
];

const typeLabels = { maladie: 'Maladie', congé: 'Congé légal', formation: 'Formation' };
const typeColors = { maladie: 'bg-mc-red-50 dark:bg-red-900/30 text-mc-red-500', congé: 'bg-mc-blue-50 dark:bg-mc-blue-900/30 text-mc-blue-500', formation: 'bg-mc-green-50 dark:bg-mc-green-900/30 text-mc-green-500' };

export function AbsencesPage() {
  const uncoveredCount = absences.filter(a => a.status === 'uncovered').length;

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<CalendarOff className="h-5 w-5" />}
        title="Gestion Absences"
        subtitle="Congés, maladies & remplacements"
        badge={<Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10">+ Déclarer</Button>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{absences.length}</p>
            <p className="text-[10px] text-white/60">Absences</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className={`text-lg font-bold ${uncoveredCount > 0 ? 'text-mc-amber-300' : 'text-white'}`}>{uncoveredCount}</p>
            <p className="text-[10px] text-white/60">Non couvertes</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{absences.filter(a => a.status === 'covered').length}</p>
            <p className="text-[10px] text-white/60">Remplacées</p>
          </div>
        </div>
      </GradientHeader>

      {/* Uncovered alert */}
      {uncoveredCount > 0 && (
        <Card glass className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-mc-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{uncoveredCount} absence(s) sans remplacement</p>
            <p className="text-xs text-[var(--text-muted)]">Suggestions IA disponibles</p>
          </div>
          <Button variant="gradient" size="sm"><Sparkles className="h-3.5 w-3.5" />Suggérer</Button>
        </Card>
      )}

      {/* AI replacement suggestions */}
      {uncoveredCount > 0 && (
        <Card>
          <CardHeader><CardTitle>Suggestions remplacement — Sophie Dupuis</CardTitle></CardHeader>
          <div className="space-y-2">
            {replacementSuggestions.map(sug => (
              <div key={sug.nurse} className="flex items-center gap-3 py-2 border-b border-[var(--border-subtle)] last:border-0">
                <Avatar name={sug.nurse} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{sug.nurse}</p>
                  <p className="text-xs text-[var(--text-muted)]">{sug.reason}</p>
                </div>
                <div className="text-right">
                  <Badge variant={sug.score >= 90 ? 'green' : 'amber'}>{sug.score}%</Badge>
                  <Button variant="outline" size="sm" className="mt-1"><UserPlus className="h-3 w-3" />Assigner</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Absence list */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Absences en cours & à venir</h3>
        {absences.map(abs => (
          <Card key={abs.id} hover padding="sm">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${typeColors[abs.type]}`}>
                <CalendarOff className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{abs.nurse}</p>
                  <Badge variant={abs.status === 'covered' ? 'green' : 'red'}>
                    {abs.status === 'covered' ? 'Remplacé' : 'Non couvert'}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{typeLabels[abs.type]} · {abs.start} → {abs.end} · {abs.days}j</p>
                {abs.replacement && <p className="text-[10px] text-mc-green-500">Remplacement: {abs.replacement}</p>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Belgian labor law counters */}
      <Card>
        <CardHeader><CardTitle>Soldes congés (Droit belge)</CardTitle></CardHeader>
        <div className="space-y-3">
          {leaveBalances.map(lb => (
            <div key={lb.nurse} className="flex items-center gap-3 py-1.5 border-b border-[var(--border-subtle)] last:border-0">
              <Avatar name={lb.nurse} size="sm" />
              <div className="flex-1">
                <p className="text-xs font-medium">{lb.nurse}</p>
                <div className="flex gap-3 text-[10px] text-[var(--text-muted)]">
                  <span>Légal: {lb.taken}/{lb.legal}j</span>
                  <span>Maladie: {lb.sick}j</span>
                  <span>Récup: {lb.recovery}j</span>
                </div>
              </div>
              <div className="h-2 w-20 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div className="h-full rounded-full bg-mc-blue-500" style={{ width: `${(lb.taken / lb.legal) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AnimatedPage>
  );
}
