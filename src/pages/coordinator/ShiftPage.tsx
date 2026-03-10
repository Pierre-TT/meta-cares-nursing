import { useMemo, useState, type FormEvent } from 'react';
import { ChevronRight, Clock, Moon, Plus, Sun, Sunrise } from 'lucide-react';
import { AnimatedPage, Badge, Button, Card, GradientHeader, Input, Modal } from '@/design-system';

type ShiftKind = 'morning' | 'afternoon' | 'night';
type ShiftStatus = 'active' | 'upcoming';
type SwapStatus = 'pending' | 'approved';

interface ShiftRecord {
  id: string;
  nurse: string;
  shift: ShiftKind;
  start: string;
  end: string;
  patients: number;
  status: ShiftStatus;
}

interface SwapRequest {
  id: string;
  from: string;
  to: string;
  shiftLabel: string;
  reason: string;
  status: SwapStatus;
}

interface ShiftFormState {
  nurse: string;
  shift: ShiftKind;
  start: string;
  end: string;
  patients: string;
}

const selectClassName =
  'w-full h-10 px-3 rounded-[0.625rem] text-sm bg-[var(--bg-primary)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-mc-blue-500/40 focus:border-mc-blue-500';

const seedShifts: ShiftRecord[] = [
  { id: 's1', nurse: 'Marie Laurent', shift: 'morning', start: '06:30', end: '14:00', patients: 8, status: 'active' },
  { id: 's2', nurse: 'Sophie Dupuis', shift: 'morning', start: '07:00', end: '14:30', patients: 6, status: 'active' },
  { id: 's3', nurse: 'Thomas Maes', shift: 'afternoon', start: '13:30', end: '21:00', patients: 7, status: 'upcoming' },
  { id: 's4', nurse: 'Laura Van Damme', shift: 'afternoon', start: '14:00', end: '21:30', patients: 5, status: 'upcoming' },
  { id: 's5', nurse: 'Jean Peeters', shift: 'night', start: '21:00', end: '06:30', patients: 3, status: 'upcoming' },
];

const seedSwapRequests: SwapRequest[] = [
  {
    id: 'swap-1',
    from: 'Thomas Maes',
    to: 'Laura Van Damme',
    shiftLabel: 'Shift 07/03 après-midi',
    reason: 'raison personnelle',
    status: 'pending',
  },
];

const shiftIcons = { morning: Sun, afternoon: Sunrise, night: Moon };
const shiftLabels = { morning: 'Matin', afternoon: 'Après-midi', night: 'Nuit' };
const shiftColors = {
  morning: 'text-mc-amber-500 bg-mc-amber-50 dark:bg-amber-900/30',
  afternoon: 'text-mc-blue-500 bg-mc-blue-50 dark:bg-mc-blue-900/30',
  night: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30',
};

const emptyForm: ShiftFormState = {
  nurse: '',
  shift: 'morning',
  start: '07:00',
  end: '14:30',
  patients: '6',
};

export function ShiftPage() {
  const [selectedShift, setSelectedShift] = useState<'all' | ShiftKind>('all');
  const [shiftRecords, setShiftRecords] = useState<ShiftRecord[]>(seedShifts);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>(seedSwapRequests);
  const [newShiftOpen, setNewShiftOpen] = useState(false);
  const [form, setForm] = useState<ShiftFormState>(emptyForm);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = selectedShift === 'all' ? shiftRecords : shiftRecords.filter((shift) => shift.shift === selectedShift);
  const activeCount = shiftRecords.filter((shift) => shift.status === 'active').length;
  const pendingSwaps = useMemo(
    () => swapRequests.filter((request) => request.status === 'pending'),
    [swapRequests]
  );

  function closeNewShiftModal() {
    setNewShiftOpen(false);
    setForm(emptyForm);
  }

  function handleCreateShift(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.nurse.trim()) {
      setFeedback('Le nom du collaborateur est requis.');
      return;
    }

    const nextShift: ShiftRecord = {
      id: `s${shiftRecords.length + 1}`,
      nurse: form.nurse.trim(),
      shift: form.shift,
      start: form.start,
      end: form.end,
      patients: Number.parseInt(form.patients, 10) || 0,
      status: 'upcoming',
    };

    setShiftRecords((previous) => [nextShift, ...previous]);
    setFeedback(`Shift créé pour ${nextShift.nurse}.`);
    closeNewShiftModal();
  }

  function handleApproveSwap(requestId: string) {
    const request = swapRequests.find((entry) => entry.id === requestId);

    if (!request) {
      return;
    }

    setSwapRequests((previous) =>
      previous.map((entry) => (entry.id === requestId ? { ...entry, status: 'approved' } : entry))
    );
    setFeedback(`Échange approuvé: ${request.from} ↔ ${request.to}.`);
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Clock className="h-5 w-5" />}
        title="Gestion des Shifts"
        subtitle="Planning des gardes"
        badge={
          <Button type="button" variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10" onClick={() => setNewShiftOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Nouveau
          </Button>
        }
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{activeCount}</p>
            <p className="text-[10px] text-white/60">En cours</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{shiftRecords.length}</p>
            <p className="text-[10px] text-white/60">Total shifts</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{shiftRecords.reduce((sum, shift) => sum + shift.patients, 0)}</p>
            <p className="text-[10px] text-white/60">Patients</p>
          </div>
        </div>
      </GradientHeader>

      {feedback && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-mc-blue-500/20 bg-mc-blue-500/10 p-3">
          <Clock className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {([['all', 'Tous'], ['morning', 'Matin'], ['afternoon', 'Après-midi'], ['night', 'Nuit']] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setSelectedShift(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              selectedShift === value ? 'bg-[image:var(--gradient-brand)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((shift) => {
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

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold">Demandes d échange</span>
          <Badge variant={pendingSwaps.length > 0 ? 'amber' : 'green'}>
            {pendingSwaps.length > 0 ? `${pendingSwaps.length} en attente` : 'À jour'}
          </Badge>
        </div>

        <div className="space-y-2">
          {swapRequests.map((request) => (
            <div key={request.id} className="flex items-center gap-3 rounded-lg bg-[var(--bg-tertiary)] p-2">
              <div className="flex-1">
                <p className="text-xs font-medium">{request.from} ↔ {request.to}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{request.shiftLabel} — {request.reason}</p>
              </div>
              {request.status === 'pending' ? (
                <Button type="button" variant="outline" size="sm" onClick={() => handleApproveSwap(request.id)}>
                  Approuver
                </Button>
              ) : (
                <Badge variant="green">Approuvé</Badge>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-mc-amber-50 dark:bg-amber-900/20 border border-mc-amber-200 dark:border-amber-800">
        <Clock className="h-4 w-4 text-mc-amber-500" />
        <span className="text-xs font-medium text-mc-amber-600 dark:text-mc-amber-400">
          Sophie Dupuis: 2h supplémentaires cette semaine (38h atteint)
        </span>
      </div>

      <Modal open={newShiftOpen} onClose={closeNewShiftModal} title="Créer un shift">
        <form className="space-y-3" onSubmit={handleCreateShift}>
          <Input
            label="Collaborateur"
            value={form.nurse}
            onChange={(event) => setForm((previous) => ({ ...previous, nurse: event.target.value }))}
            placeholder="Nom du collaborateur"
            required
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--text-secondary)]" htmlFor="shift-type">
              Type
            </label>
            <select
              id="shift-type"
              className={selectClassName}
              value={form.shift}
              onChange={(event) => setForm((previous) => ({ ...previous, shift: event.target.value as ShiftKind }))}
            >
              <option value="morning">Matin</option>
              <option value="afternoon">Après-midi</option>
              <option value="night">Nuit</option>
            </select>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Début"
              type="time"
              value={form.start}
              onChange={(event) => setForm((previous) => ({ ...previous, start: event.target.value }))}
              required
            />
            <Input
              label="Fin"
              type="time"
              value={form.end}
              onChange={(event) => setForm((previous) => ({ ...previous, end: event.target.value }))}
              required
            />
          </div>

          <Input
            label="Patients"
            type="number"
            min="0"
            value={form.patients}
            onChange={(event) => setForm((previous) => ({ ...previous, patients: event.target.value }))}
            required
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeNewShiftModal}>
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
