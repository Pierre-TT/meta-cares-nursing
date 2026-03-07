import { useState } from 'react';
import { Pill, Clock, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, AnimatedPage, GradientHeader } from '@/design-system';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  prescriber: string;
  startDate: string;
  endDate?: string;
  taken: boolean[];
  notes?: string;
}

const medications: Medication[] = [
  {
    id: '1', name: 'Metformine', dosage: '850 mg', frequency: '2x/jour (matin, soir)',
    route: 'Oral', prescriber: 'Dr. Dupont', startDate: '01/01/2025',
    taken: [true, true, true, false, true, true, true], notes: 'Prendre pendant le repas',
  },
  {
    id: '2', name: 'Lisinopril', dosage: '10 mg', frequency: '1x/jour (matin)',
    route: 'Oral', prescriber: 'Dr. Dupont', startDate: '15/02/2025',
    taken: [true, true, true, true, true, false, true],
  },
  {
    id: '3', name: 'Insuline Lantus', dosage: '18 UI', frequency: '1x/jour (soir)',
    route: 'Sous-cutané', prescriber: 'Dr. Janssen', startDate: '01/03/2025',
    taken: [true, true, true, true, true, true, true], notes: 'Injection abdomen — rotation des sites',
  },
  {
    id: '4', name: 'Paracétamol', dosage: '1 g', frequency: 'Si douleur (max 3x/jour)',
    route: 'Oral', prescriber: 'Dr. Dupont', startDate: '01/02/2025',
    endDate: '01/04/2025', taken: [false, true, false, false, true, false, false],
  },
];

const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function TreatmentsPage() {
  const [selected, setSelected] = useState<Medication | null>(null);

  const adherenceRate = (med: Medication) => {
    const total = med.taken.length;
    const taken = med.taken.filter(Boolean).length;
    return Math.round((taken / total) * 100);
  };

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<Pill className="h-5 w-5" />}
        title="Mes Traitements"
        subtitle={`${medications.length} médicaments actifs`}
        badge={<Badge variant="blue">Vitalink</Badge>}
      />

      <Card glass>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-mc-blue-500 to-mc-green-500 flex items-center justify-center">
            <Pill className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold">{medications.length} médicaments actifs</p>
            <p className="text-sm text-[var(--text-muted)]">Prochaine prise : Metformine — ce soir</p>
          </div>
        </div>
      </Card>

      {/* Weekly pilulier */}
      <Card>
        <CardHeader><CardTitle>Pilulier — Semaine en cours</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <div className="min-w-[28rem]">
            <div className="grid grid-cols-8 gap-1 text-xs font-medium text-[var(--text-muted)] mb-1">
              <span />
              {days.map(d => <span key={d} className="text-center">{d}</span>)}
            </div>
            {medications.map(med => (
              <div key={med.id} className="grid grid-cols-8 gap-1 items-center py-1 border-b border-[var(--border-subtle)] last:border-0">
                <span className="text-xs font-medium truncate">{med.name}</span>
                {med.taken.map((t, i) => (
                  <div key={i} className="flex justify-center">
                    {t ? (
                      <CheckCircle2 className="h-4 w-4 text-mc-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-[var(--border-default)]" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Medication list */}
      <div className="space-y-3">
        {medications.map(med => (
          <Card key={med.id} className="cursor-pointer hover:ring-2 hover:ring-mc-blue-500/30 transition-all" onClick={() => setSelected(selected?.id === med.id ? null : med)}>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-semibold">{med.name} — {med.dosage}</p>
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{med.frequency}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{med.route} · Prescrit par {med.prescriber}</p>
              </div>
              <div className="text-right space-y-1">
                <Badge variant={adherenceRate(med) >= 80 ? 'green' : 'amber'}>
                  {adherenceRate(med)}%
                </Badge>
                {med.endDate && <p className="text-xs text-[var(--text-muted)]">Fin: {med.endDate}</p>}
              </div>
            </div>

            {selected?.id === med.id && (
              <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[var(--text-muted)]" />
                  <span>Début: {med.startDate}{med.endDate ? ` — Fin: ${med.endDate}` : ' — En cours'}</span>
                </div>
                {med.notes && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-mc-amber-500/10">
                    <AlertTriangle className="h-4 w-4 text-mc-amber-500 mt-0.5" />
                    <span>{med.notes}</span>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Drug interaction warning */}
      <Card className="border-l-4 border-l-mc-amber-500 bg-mc-amber-50 dark:bg-amber-900/15">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-mc-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-mc-amber-600 dark:text-mc-amber-400">Interaction potentielle</p>
            <p className="text-[10px] text-[var(--text-muted)]">Metformine + Lisinopril : surveiller fonction rénale. Prochain contrôle recommandé.</p>
          </div>
        </div>
      </Card>

      {/* Refill reminder */}
      <Card className="flex items-center gap-3">
        <Pill className="h-5 w-5 text-mc-blue-500" />
        <div className="flex-1">
          <p className="text-xs font-bold">Renouvellement prescription</p>
          <p className="text-[10px] text-[var(--text-muted)]">Insuline Lantus — ordonnance expire dans 12 jours</p>
        </div>
        <Badge variant="amber">12j</Badge>
      </Card>

      <p className="text-xs text-center text-[var(--text-muted)] pt-2">
        Données issues du schéma de médication Vitalink · Mise à jour: 06/03/2025
      </p>
    </AnimatedPage>
  );
}
