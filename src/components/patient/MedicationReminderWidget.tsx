import { useState } from 'react';
import { Pill, CheckCircle2, X } from 'lucide-react';
import { Badge, Button, Card } from '@/design-system';

interface MedReminder {
  id: string;
  name: string;
  dosage: string;
  time: string;
}

interface Props {
  reminders: MedReminder[];
}

export function MedicationReminderWidget({ reminders }: Props) {
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  const confirm = (id: string) => setConfirmed(prev => new Set(prev).add(id));
  const skip = (id: string) => setSkipped(prev => new Set(prev).add(id));

  return (
    <div className="space-y-2">
      {reminders.map(med => {
        const isDone = confirmed.has(med.id);
        const isSkipped = skipped.has(med.id);
        if (isSkipped) return null;
        return (
          <Card key={med.id} padding="sm">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${isDone ? 'bg-mc-green-50 dark:bg-mc-green-900/20' : 'bg-mc-amber-50 dark:bg-amber-900/20'}`}>
                {isDone ? <CheckCircle2 className="h-4 w-4 text-mc-green-500" /> : <Pill className="h-4 w-4 text-mc-amber-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isDone ? 'line-through text-[var(--text-muted)]' : ''}`}>{med.name}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{med.dosage} · {med.time}</p>
              </div>
              {!isDone && (
                <div className="flex gap-1">
                  <Button variant="primary" size="sm" onClick={() => confirm(med.id)}>Pris ✓</Button>
                  <button onClick={() => skip(med.id)} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)]">
                    <X className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  </button>
                </div>
              )}
              {isDone && <Badge variant="green">Pris</Badge>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
