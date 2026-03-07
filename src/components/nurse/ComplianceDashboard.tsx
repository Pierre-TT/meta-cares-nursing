import { ShieldCheck, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, Badge, StatRing } from '@/design-system';

interface ComplianceItem {
  label: string;
  status: 'ok' | 'warning' | 'overdue';
  detail: string;
}

const items: ComplianceItem[] = [
  { label: 'Dossiers patients à jour', status: 'ok', detail: '28/28 complétés' },
  { label: 'Notes de soins signées', status: 'warning', detail: '2 notes en attente de signature' },
  { label: 'Formulaires INAMI', status: 'ok', detail: 'Tous soumis ce mois' },
  { label: 'Vérification identité patient', status: 'ok', detail: '100% effectuée cette semaine' },
  { label: 'Formation hygiène des mains', status: 'overdue', detail: 'Renouvellement requis avant 15/03' },
];

const statusIcon = {
  ok: <CheckCircle className="h-3.5 w-3.5 text-mc-green-500" />,
  warning: <Clock className="h-3.5 w-3.5 text-mc-amber-500" />,
  overdue: <AlertTriangle className="h-3.5 w-3.5 text-mc-red-500" />,
};

const statusVariant = {
  ok: 'green' as const,
  warning: 'amber' as const,
  overdue: 'red' as const,
};

export function ComplianceDashboard() {
  const okCount = items.filter(i => i.status === 'ok').length;
  const score = Math.round((okCount / items.length) * 100);

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-mc-green-500/10 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-mc-green-500" />
          </div>
          <div>
            <p className="text-xs font-semibold">Conformité</p>
            <p className="text-[10px] text-[var(--text-muted)]">Tableau de bord réglementaire</p>
          </div>
        </div>
        <StatRing value={score} max={100} label="%" size={40} color={score >= 80 ? 'green' : score >= 60 ? 'amber' : 'red'} />
      </div>

      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 py-1">
            {statusIcon[item.status]}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">{item.label}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{item.detail}</p>
            </div>
            <Badge variant={statusVariant[item.status]} className="text-[9px] shrink-0">
              {item.status === 'ok' ? 'OK' : item.status === 'warning' ? 'Attention' : 'En retard'}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
