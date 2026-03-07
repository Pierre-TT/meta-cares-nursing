import { ArrowRight, Brain, Clock3, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CardHeader, CardTitle } from '@/design-system';
import { useBelraiTwin } from '@/hooks/useBelraiTwin';
import type { Patient } from '@/lib/patients';

function toneToBadgeVariant(tone: 'blue' | 'green' | 'amber' | 'red') {
  return tone;
}

export function BelRAILiveCard({
  patient,
  className = '',
}: {
  patient: Patient;
  className?: string;
}) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useBelraiTwin(patient.id);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>BelRAI Twin</CardTitle>
          <Badge variant="blue">Chargement</Badge>
        </CardHeader>
        <p className="text-sm text-[var(--text-muted)]">
          Consolidation du dossier, des preuves et du brouillon BelRAI.
        </p>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>BelRAI Twin</CardTitle>
          <Badge variant="red">Indisponible</Badge>
        </CardHeader>
        <p className="text-sm text-[var(--text-muted)]">
          Le jumeau BelRAI local ne peut pas être chargé pour ce patient.
        </p>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-mc-blue-500" />
          <CardTitle>BelRAI Twin</CardTitle>
        </div>
        <Badge variant={toneToBadgeVariant(data.statusTone)}>{data.statusLabel}</Badge>
      </CardHeader>

      <p className="text-sm text-[var(--text-muted)]">
        {data.syncLabel}. {data.persistenceLabel}. Prochaine revue recommandée le <span className="font-medium text-[var(--text-primary)]">{data.dueDate}</span>.
      </p>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="rounded-xl bg-[var(--bg-secondary)] p-3">
          <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Progression</p>
          <p className="text-lg font-bold">{data.progress.percent}%</p>
          <p className="text-xs text-[var(--text-muted)]">
            {data.progress.answeredItems}/{data.progress.totalItems} items
          </p>
        </div>

        <div className="rounded-xl bg-[var(--bg-secondary)] p-3">
          <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Katz estimé</p>
          <p className="text-lg font-bold">{data.katz.category}</p>
          <p className="text-xs text-[var(--text-muted)]">{data.katz.forfait}</p>
        </div>

        <div className="rounded-xl bg-[var(--bg-secondary)] p-3">
          <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">CAPs actives</p>
          <p className="text-lg font-bold">{data.caps.length}</p>
          <p className="text-xs text-[var(--text-muted)]">{data.progress.confirmedItems} preuves confirmées</p>
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <div className="flex items-start gap-2 rounded-xl bg-mc-blue-500/10 p-3">
          <Sparkles className="h-4 w-4 text-mc-blue-500 mt-0.5" />
          <p className="text-xs text-[var(--text-secondary)]">{data.nextAction}</p>
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-[var(--bg-secondary)] p-3">
          <ShieldCheck className="h-4 w-4 text-mc-green-500 mt-0.5" />
          <div className="text-xs text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">Dernière consolidation</p>
            <p>{data.lastUpdatedLabel}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-[var(--bg-secondary)] p-3">
          <Clock3 className="h-4 w-4 text-mc-amber-500 mt-0.5" />
          <div className="text-xs text-[var(--text-secondary)]">
            <p className="font-medium text-[var(--text-primary)]">CAPs prioritaires</p>
            <p>
              {data.caps.slice(0, 2).map((cap) => cap.title).join(' · ') || 'Aucune CAP active pour le moment.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          className="justify-start"
          onClick={() => navigate(`/nurse/care-plan?patientId=${patient.id}`)}
        >
          <ShieldCheck className="h-4 w-4" />
          Plan de soins
        </Button>
        <Button
          variant="gradient"
          size="sm"
          className="justify-start"
          onClick={() => navigate(`/nurse/belrai/${patient.id}`)}
        >
          <ArrowRight className="h-4 w-4" />
          Ouvrir BelRAI
        </Button>
      </div>
    </Card>
  );
}
