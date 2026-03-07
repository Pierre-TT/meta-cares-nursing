import { Brain, TrendingUp, TrendingDown, User } from 'lucide-react';
import { Card, Badge, AnimatedPage } from '@/design-system';

interface PatientRisk {
  id: string;
  name: string;
  age: number;
  katz: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  trend: 'up' | 'down' | 'stable';
  lastVisit: string;
}

const patients: PatientRisk[] = [
  { id: '1', name: 'Dubois Françoise', age: 82, katz: 'C', riskScore: 78, riskLevel: 'high', factors: ['Chutes récentes', 'HTA non contrôlée', 'BelRAI cognition ↓', 'Isolement social'], trend: 'up', lastVisit: '06/03' },
  { id: '2', name: 'Peeters Jan', age: 75, katz: 'C', riskScore: 65, riskLevel: 'medium', factors: ['Soins palliatifs', 'Douleur chronique', 'Perte de poids'], trend: 'stable', lastVisit: '05/03' },
  { id: '3', name: 'Janssens Maria', age: 80, katz: 'B', riskScore: 42, riskLevel: 'medium', factors: ['Diabète type 2', 'Glycémie instable', 'Plaie jambe G'], trend: 'down', lastVisit: '06/03' },
  { id: '4', name: 'Van Damme Pierre', age: 68, katz: 'A', riskScore: 18, riskLevel: 'low', factors: ['HTA contrôlée'], trend: 'stable', lastVisit: '06/03' },
  { id: '5', name: 'Claes Anne', age: 72, katz: 'B', riskScore: 25, riskLevel: 'low', factors: ['Post-chirurgie stable'], trend: 'down', lastVisit: '04/03' },
];

const riskConfig = {
  high: { label: 'Élevé', variant: 'red' as const, color: 'text-mc-red-500', bg: 'bg-mc-red-500' },
  medium: { label: 'Modéré', variant: 'amber' as const, color: 'text-mc-amber-500', bg: 'bg-mc-amber-500' },
  low: { label: 'Faible', variant: 'green' as const, color: 'text-mc-green-500', bg: 'bg-mc-green-500' },
};

export function PredictiveDashboardPage() {
  const highRisk = patients.filter(p => p.riskLevel === 'high').length;
  const medRisk = patients.filter(p => p.riskLevel === 'medium').length;
  const lowRisk = patients.filter(p => p.riskLevel === 'low').length;

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Risque Réhospitalisation</h1>
        <Badge variant="blue">
          <Brain className="h-3.5 w-3.5 mr-1" /> IA
        </Badge>
      </div>

      <Card glass>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-mc-blue-500 to-mc-green-500 flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold">Analyse prédictive</p>
            <p className="text-xs text-[var(--text-muted)]">Basée sur BelRAI + paramètres vitaux + historique hospitalisations</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-mc-red-500/10">
            <p className="text-xl font-bold text-mc-red-500">{highRisk}</p>
            <p className="text-xs text-[var(--text-muted)]">Risque élevé</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-mc-amber-500/10">
            <p className="text-xl font-bold text-mc-amber-500">{medRisk}</p>
            <p className="text-xs text-[var(--text-muted)]">Modéré</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-mc-green-500/10">
            <p className="text-xl font-bold text-mc-green-500">{lowRisk}</p>
            <p className="text-xs text-[var(--text-muted)]">Faible</p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {patients.map(p => {
          const cfg = riskConfig[p.riskLevel];
          return (
            <Card key={p.id} className={p.riskLevel === 'high' ? 'border-l-4 border-l-mc-red-500' : ''}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{p.age} ans · Katz {p.katz} · Visite: {p.lastVisit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className={`text-lg font-bold ${cfg.color}`}>{p.riskScore}%</span>
                    {p.trend === 'up' ? <TrendingUp className="h-4 w-4 text-mc-red-500" /> :
                     p.trend === 'down' ? <TrendingDown className="h-4 w-4 text-mc-green-500" /> : null}
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </div>
              </div>

              {/* Risk bar */}
              <div className="h-2 rounded-full bg-[var(--bg-tertiary)] mb-2">
                <div className={`h-2 rounded-full ${cfg.bg} transition-all`} style={{ width: `${p.riskScore}%` }} />
              </div>

              {/* Factors */}
              <div className="flex flex-wrap gap-1">
                {p.factors.map(f => (
                  <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                    {f}
                  </span>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </AnimatedPage>
  );
}
