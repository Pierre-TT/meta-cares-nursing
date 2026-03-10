import { useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, CalendarOff, Sparkles, UserPlus } from 'lucide-react';
import { AnimatedPage, Avatar, Badge, Button, Card, CardHeader, CardTitle, GradientHeader, Input, Modal } from '@/design-system';

type AbsenceType = 'maladie' | 'conge' | 'formation';
type AbsenceStatus = 'covered' | 'uncovered';

interface AbsenceRecord {
  id: string;
  nurse: string;
  type: AbsenceType;
  start: string;
  end: string;
  days: number;
  replacement: string | null;
  status: AbsenceStatus;
}

interface ReplacementSuggestion {
  nurse: string;
  reason: string;
  score: number;
}

interface AbsenceFormState {
  nurse: string;
  type: AbsenceType;
  start: string;
  end: string;
}

const selectClassName =
  'w-full h-10 px-3 rounded-[0.625rem] text-sm bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-mc-blue-500/40 focus:border-mc-blue-500';

const seedAbsences: AbsenceRecord[] = [
  { id: 'a1', nurse: 'Kevin Peeters', type: 'maladie', start: '2026-03-06', end: '2026-03-08', days: 3, replacement: 'Thomas Maes', status: 'covered' },
  { id: 'a2', nurse: 'Sophie Dupuis', type: 'conge', start: '2026-03-10', end: '2026-03-14', days: 5, replacement: null, status: 'uncovered' },
  { id: 'a3', nurse: 'Marie Laurent', type: 'formation', start: '2026-03-12', end: '2026-03-12', days: 1, replacement: 'Laura Van Damme', status: 'covered' },
];

const leaveBalances = [
  { nurse: 'Marie Laurent', legal: 14, taken: 8, sick: 2, recovery: 1 },
  { nurse: 'Sophie Dupuis', legal: 14, taken: 10, sick: 4, recovery: 2 },
  { nurse: 'Thomas Maes', legal: 14, taken: 6, sick: 1, recovery: 0 },
  { nurse: 'Laura Van Damme', legal: 14, taken: 9, sick: 3, recovery: 1 },
  { nurse: 'Kevin Peeters', legal: 14, taken: 5, sick: 8, recovery: 0 },
];

const seedReplacementSuggestions: ReplacementSuggestion[] = [
  { nurse: 'Thomas Maes', reason: 'Même zone (Uccle adj.), spécialité compatible, disponible', score: 95 },
  { nurse: 'Laura Van Damme', reason: 'Zone proche, 3 patients en commun', score: 78 },
];

const typeLabels: Record<AbsenceType, string> = {
  maladie: 'Maladie',
  conge: 'Congé légal',
  formation: 'Formation',
};

const typeColors: Record<AbsenceType, string> = {
  maladie: 'bg-mc-red-50 dark:bg-red-900/30 text-mc-red-500',
  conge: 'bg-mc-blue-50 dark:bg-mc-blue-900/30 text-mc-blue-500',
  formation: 'bg-mc-green-50 dark:bg-mc-green-900/30 text-mc-green-500',
};

const emptyForm: AbsenceFormState = {
  nurse: '',
  type: 'conge',
  start: '2026-03-16',
  end: '2026-03-16',
};

function formatDisplayDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('fr-BE');
}

function countDays(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const diff = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.floor(diff / (24 * 60 * 60 * 1000)) + 1);
}

export function AbsencesPage() {
  const [absenceRecords, setAbsenceRecords] = useState<AbsenceRecord[]>(seedAbsences);
  const [replacementSuggestions, setReplacementSuggestions] = useState<ReplacementSuggestion[]>(seedReplacementSuggestions);
  const [declareOpen, setDeclareOpen] = useState(false);
  const [form, setForm] = useState<AbsenceFormState>(emptyForm);
  const [feedback, setFeedback] = useState<string | null>(null);

  const uncoveredAbsence = absenceRecords.find((absence) => absence.status === 'uncovered') ?? null;
  const uncoveredCount = absenceRecords.filter((absence) => absence.status === 'uncovered').length;
  const orderedSuggestions = useMemo(
    () => [...replacementSuggestions].sort((left, right) => right.score - left.score),
    [replacementSuggestions]
  );

  function closeDeclareModal() {
    setDeclareOpen(false);
    setForm(emptyForm);
  }

  function handleDeclare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.nurse.trim()) {
      setFeedback('Le nom du collaborateur est requis.');
      return;
    }

    const nextAbsence: AbsenceRecord = {
      id: `a${absenceRecords.length + 1}`,
      nurse: form.nurse.trim(),
      type: form.type,
      start: form.start,
      end: form.end,
      days: countDays(form.start, form.end),
      replacement: null,
      status: 'uncovered',
    };

    setAbsenceRecords((previous) => [nextAbsence, ...previous]);
    setFeedback(`Absence déclarée pour ${nextAbsence.nurse}.`);
    closeDeclareModal();
  }

  function handleSuggest() {
    if (!uncoveredAbsence) {
      setFeedback('Aucune absence à couvrir pour le moment.');
      return;
    }

    setReplacementSuggestions((previous) => [...previous].sort((left, right) => right.score - left.score));
    setFeedback(`Suggestions IA rafraîchies pour ${uncoveredAbsence.nurse}.`);
  }

  function handleAssignReplacement(suggestion: ReplacementSuggestion) {
    if (!uncoveredAbsence) {
      setFeedback('Aucune absence à affecter.');
      return;
    }

    setAbsenceRecords((previous) =>
      previous.map((absence) =>
        absence.id === uncoveredAbsence.id
          ? { ...absence, replacement: suggestion.nurse, status: 'covered' }
          : absence
      )
    );
    setFeedback(`${suggestion.nurse} assigné à ${uncoveredAbsence.nurse}.`);
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<CalendarOff className="h-5 w-5" />}
        title="Gestion Absences"
        subtitle="Congés, maladies & remplacements"
        badge={
          <Button type="button" variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10" onClick={() => setDeclareOpen(true)}>
            + Déclarer
          </Button>
        }
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{absenceRecords.length}</p>
            <p className="text-[10px] text-white/60">Absences</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className={`text-lg font-bold ${uncoveredCount > 0 ? 'text-mc-amber-300' : 'text-white'}`}>{uncoveredCount}</p>
            <p className="text-[10px] text-white/60">Non couvertes</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{absenceRecords.filter((absence) => absence.status === 'covered').length}</p>
            <p className="text-[10px] text-white/60">Remplacées</p>
          </div>
        </div>
      </GradientHeader>

      {feedback && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-mc-blue-500/20 bg-mc-blue-500/10 p-3">
          <CalendarOff className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      {uncoveredCount > 0 && (
        <Card glass className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-mc-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{uncoveredCount} absence(s) sans remplacement</p>
            <p className="text-xs text-[var(--text-muted)]">Suggestions IA disponibles</p>
          </div>
          <Button type="button" variant="gradient" size="sm" onClick={handleSuggest}>
            <Sparkles className="h-3.5 w-3.5" />
            Suggérer
          </Button>
        </Card>
      )}

      {uncoveredCount > 0 && uncoveredAbsence && (
        <Card>
          <CardHeader>
            <CardTitle>Suggestions remplacement - {uncoveredAbsence.nurse}</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {orderedSuggestions.map((suggestion) => (
              <div key={suggestion.nurse} className="flex items-center gap-3 py-2 border-b border-[var(--border-subtle)] last:border-0">
                <Avatar name={suggestion.nurse} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{suggestion.nurse}</p>
                  <p className="text-xs text-[var(--text-muted)]">{suggestion.reason}</p>
                </div>
                <div className="text-right">
                  <Badge variant={suggestion.score >= 90 ? 'green' : 'amber'}>{suggestion.score}%</Badge>
                  <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => handleAssignReplacement(suggestion)}>
                    <UserPlus className="h-3 w-3" />
                    Assigner
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Absences en cours & à venir</h3>
        {absenceRecords.map((absence) => (
          <Card key={absence.id} hover padding="sm">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${typeColors[absence.type]}`}>
                <CalendarOff className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{absence.nurse}</p>
                  <Badge variant={absence.status === 'covered' ? 'green' : 'red'}>
                    {absence.status === 'covered' ? 'Remplacé' : 'Non couvert'}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  {typeLabels[absence.type]} · {formatDisplayDate(absence.start)} → {formatDisplayDate(absence.end)} · {absence.days}j
                </p>
                {absence.replacement && <p className="text-[10px] text-mc-green-500">Remplacement: {absence.replacement}</p>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Soldes congés (Droit belge)</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {leaveBalances.map((balance) => (
            <div key={balance.nurse} className="flex items-center gap-3 py-1.5 border-b border-[var(--border-subtle)] last:border-0">
              <Avatar name={balance.nurse} size="sm" />
              <div className="flex-1">
                <p className="text-xs font-medium">{balance.nurse}</p>
                <div className="flex gap-3 text-[10px] text-[var(--text-muted)]">
                  <span>Légal: {balance.taken}/{balance.legal}j</span>
                  <span>Maladie: {balance.sick}j</span>
                  <span>Récup: {balance.recovery}j</span>
                </div>
              </div>
              <div className="h-2 w-20 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div className="h-full rounded-full bg-mc-blue-500" style={{ width: `${(balance.taken / balance.legal) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={declareOpen} onClose={closeDeclareModal} title="Déclarer une absence">
        <form className="space-y-3" onSubmit={handleDeclare}>
          <Input
            label="Collaborateur"
            value={form.nurse}
            onChange={(event) => setForm((previous) => ({ ...previous, nurse: event.target.value }))}
            placeholder="Nom du collaborateur"
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]" htmlFor="absence-type">
              Type
            </label>
            <select
              id="absence-type"
              className={selectClassName}
              value={form.type}
              onChange={(event) => setForm((previous) => ({ ...previous, type: event.target.value as AbsenceType }))}
            >
              <option value="maladie">Maladie</option>
              <option value="conge">Congé légal</option>
              <option value="formation">Formation</option>
            </select>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Début"
              type="date"
              value={form.start}
              onChange={(event) => setForm((previous) => ({ ...previous, start: event.target.value }))}
              required
            />
            <Input
              label="Fin"
              type="date"
              value={form.end}
              onChange={(event) => setForm((previous) => ({ ...previous, end: event.target.value }))}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeDeclareModal}>
              Annuler
            </Button>
            <Button type="submit">
              Enregistrer
            </Button>
          </div>
        </form>
      </Modal>
    </AnimatedPage>
  );
}
