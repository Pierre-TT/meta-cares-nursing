import { GitBranch, AlertTriangle, Users, Heart, CheckCircle, ArrowRightLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Avatar, AnimatedPage, GradientHeader } from '@/design-system';

const patientContinuity = [
  { patient: 'Dubois Marie', mainNurse: 'Marie Laurent', uniqueNurses: 2, maxAllowed: 3, continuityIndex: 92, preference: 'Préfère Marie — habituée', status: 'good' as const },
  { patient: 'Janssen Pierre', mainNurse: 'Marie Laurent', uniqueNurses: 3, maxAllowed: 3, continuityIndex: 78, preference: null, status: 'warning' as const },
  { patient: 'Lambert Jeanne', mainNurse: 'Sophie Dupuis', uniqueNurses: 1, maxAllowed: 3, continuityIndex: 100, preference: null, status: 'good' as const },
  { patient: 'Willems André', mainNurse: 'Laura Van Damme', uniqueNurses: 4, maxAllowed: 3, continuityIndex: 55, preference: 'Demande infirmier homme', status: 'alert' as const },
  { patient: 'Peeters Henri', mainNurse: 'Thomas Maes', uniqueNurses: 2, maxAllowed: 3, continuityIndex: 88, preference: null, status: 'good' as const },
];

const recentHandoffs = [
  { from: 'Marie Laurent', to: 'Sophie Dupuis', patient: 'Lambert J.', date: '05/03/2026', reason: 'Congé Marie' },
  { from: 'Kevin Peeters', to: 'Thomas Maes', patient: 'Peeters H.', date: '04/03/2026', reason: 'Maladie Kevin' },
  { from: 'Laura Van Damme', to: 'Marie Laurent', patient: 'Willems A.', date: '03/03/2026', reason: 'Surcharge Laura' },
];

export function ContinuityPage() {
  const avgIndex = Math.round(patientContinuity.reduce((s, p) => s + p.continuityIndex, 0) / patientContinuity.length);
  const alertCount = patientContinuity.filter(p => p.status === 'alert').length;

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<GitBranch className="h-5 w-5" />}
        title="Continuité des Soins"
        subtitle="Index & transferts"
        badge={<Badge variant={avgIndex >= 80 ? 'green' : 'amber'}>{avgIndex}% moy.</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{avgIndex}%</p>
            <p className="text-[10px] text-white/60">Index moy.</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{recentHandoffs.length}</p>
            <p className="text-[10px] text-white/60">Transferts</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className={`text-lg font-bold ${alertCount > 0 ? 'text-mc-amber-300' : 'text-white'}`}>{alertCount}</p>
            <p className="text-[10px] text-white/60">Alertes</p>
          </div>
        </div>
      </GradientHeader>

      {/* Continuity per patient */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Index par patient</h3>
        {patientContinuity.map(p => (
          <Card key={p.patient} hover padding="sm">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                p.status === 'good' ? 'bg-mc-green-50 dark:bg-mc-green-900/30' :
                p.status === 'warning' ? 'bg-mc-amber-50 dark:bg-amber-900/30' :
                'bg-mc-red-50 dark:bg-red-900/30'
              }`}>
                {p.status === 'good' ? <CheckCircle className="h-5 w-5 text-mc-green-500" /> :
                 p.status === 'warning' ? <Users className="h-5 w-5 text-mc-amber-500" /> :
                 <AlertTriangle className="h-5 w-5 text-mc-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{p.patient}</p>
                  <Badge variant={p.status === 'good' ? 'green' : p.status === 'warning' ? 'amber' : 'red'}>
                    {p.continuityIndex}%
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  Réf: {p.mainNurse} · {p.uniqueNurses}/{p.maxAllowed} infirmiers différents
                </p>
                {p.preference && (
                  <p className="text-[10px] text-mc-blue-500 flex items-center gap-1 mt-0.5">
                    <Heart className="h-2.5 w-2.5" />{p.preference}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent handoffs */}
      <Card>
        <CardHeader><CardTitle>Transferts récents</CardTitle></CardHeader>
        <div className="space-y-2">
          {recentHandoffs.map((h, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-[var(--border-subtle)] last:border-0">
              <Avatar name={h.from} size="sm" />
              <ArrowRightLeft className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
              <Avatar name={h.to} size="sm" />
              <div className="flex-1">
                <p className="text-xs font-medium">{h.patient}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{h.from} → {h.to} · {h.reason}</p>
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">{h.date}</span>
            </div>
          ))}
        </div>
      </Card>
    </AnimatedPage>
  );
}
