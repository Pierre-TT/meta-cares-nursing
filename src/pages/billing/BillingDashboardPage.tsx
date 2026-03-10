import { useNavigate } from 'react-router-dom';
import {
  Euro, TrendingUp, AlertTriangle, CheckCircle, Send,
  BookOpen, Calculator, Activity, Wifi, WifiOff, Sparkles, Users, ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, AnimatedPage, GradientHeader, StatRing } from '@/design-system';
import { useHourlyPilotAdminOverview } from '@/hooks/useHourlyPilotData';
import { useBillingDashboardData } from '@/hooks/usePlatformData';
import { useBillingAutopilot } from '@/hooks/useBillingAutopilot';

const billingActivityIcons = {
  send: Send,
  check: CheckCircle,
  alert: AlertTriangle,
  euro: Euro,
} as const;

export function BillingDashboardPage() {
  const navigate = useNavigate();
  const { data } = useBillingDashboardData();
  const { data: pilotOverview } = useHourlyPilotAdminOverview();
  const { data: autopilot, isLoading: isAutopilotLoading, error: autopilotError } = useBillingAutopilot();
  const { kpis, revenueTrend, recentActivity, mutuelleStatus } = data;
  const maxVal = Math.max(...revenueTrend.map(r => r.value), 1);
  const revenueGrowth =
    kpis.prevMonthRevenue > 0
      ? ((kpis.monthlyRevenue - kpis.prevMonthRevenue) / kpis.prevMonthRevenue * 100).toFixed(1)
      : '0.0';
  const degradedMutuelles = mutuelleStatus.filter((item) => item.status !== 'online').length;
  const gatewayHealthy = degradedMutuelles === 0;
  const quickActions = [
    { icon: Send, label: 'Envoyer\neFact', path: '/billing/batches', gradient: 'from-mc-blue-500 to-mc-blue-600' },
    { icon: AlertTriangle, label: 'Rejets\nà traiter', path: '/billing/rejections', gradient: 'from-mc-red-500 to-mc-red-600', badge: kpis.rejections },
    { icon: BookOpen, label: 'Nomenclature\nINAMI', path: '/billing/nomenclature', gradient: 'from-mc-green-500 to-mc-green-600' },
    { icon: Calculator, label: 'Simulateur\ntarif', path: '/billing/simulator', gradient: 'from-mc-amber-500 to-mc-amber-600' },
  ];

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-6xl mx-auto space-y-5">
      <GradientHeader
        icon={<Activity className="h-5 w-5" />}
        title="Bureau de Tarification"
        subtitle={new Date().toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        badge={
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/15">
            {gatewayHealthy ? <Wifi className="h-3 w-3 text-mc-green-300" /> : <WifiOff className="h-3 w-3 text-mc-amber-300" />}
            <span className="text-[10px] font-medium text-white/80">{gatewayHealthy ? 'MyCareNet' : `${degradedMutuelles} flux dégradé`}</span>
          </div>
        }
      >
        <div className="flex items-center justify-around mt-1">
          <StatRing value={kpis.dailyInvoices} max={60} label="Factures" color="blue" size={62} strokeWidth={5} />
          <StatRing value={kpis.acceptanceRate} max={100} label="Accept." suffix="%" color="green" size={62} strokeWidth={5} />
          <StatRing value={kpis.rejections} max={20} label="Rejets" color="red" size={62} strokeWidth={5} />
          <StatRing value={kpis.avgProcessingMin} max={10} label="min/fact" color="blue" size={62} strokeWidth={5} />
        </div>
      </GradientHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card glass className="text-center">
          <p className="text-2xl font-bold">€{kpis.pendingAmount.toLocaleString('fr-BE')}</p>
          <p className="text-xs text-[var(--text-muted)]">En attente</p>
        </Card>
        <Card glass className="text-center">
          <p className="text-2xl font-bold text-mc-green-500">€{kpis.monthlyRevenue.toLocaleString('fr-BE')}</p>
          <p className="text-xs text-[var(--text-muted)]">CA Mars</p>
        </Card>
        <Card glass className="text-center">
          <div className="flex items-center justify-center gap-1">
            <p className="text-2xl font-bold text-mc-green-500">+{revenueGrowth}%</p>
            <TrendingUp className="h-4 w-4 text-mc-green-500" />
          </div>
          <p className="text-xs text-[var(--text-muted)]">vs Février</p>
        </Card>
        <Card glass className="text-center">
          <p className="text-2xl font-bold">{kpis.acceptanceRate}%</p>
          <p className="text-xs text-[var(--text-muted)]">Taux d'acceptation</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        {quickActions.map(qa => (
          <button
            key={qa.label}
            onClick={() => navigate(qa.path)}
            className="relative flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-default)] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${qa.gradient} flex items-center justify-center`}>
              <qa.icon className="h-5 w-5 text-white" />
            </div>
            <span className="text-[10px] font-medium text-center text-[var(--text-secondary)] leading-tight whitespace-pre-line">
              {qa.label}
            </span>
            {qa.badge && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-mc-red-500 text-white text-[9px] font-bold">
                {qa.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Chiffre d'affaires — 6 derniers mois</CardTitle>
          <Badge variant="green">+{revenueGrowth}%</Badge>
        </CardHeader>
        <div className="flex items-end gap-2 h-32 mt-2">
          {revenueTrend.map((m, i) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold text-[var(--text-muted)]">€{(m.value / 1000).toFixed(1)}k</span>
              <div
                className={`w-full rounded-t-lg transition-all ${i === revenueTrend.length - 1 ? 'bg-gradient-to-t from-mc-blue-500 to-mc-green-500' : 'bg-mc-blue-500/30'}`}
                style={{ height: `${(m.value / maxVal) * 100}%` }}
              />
              <span className="text-[10px] text-[var(--text-muted)]">{m.month}</span>
            </div>
          ))}
        </div>
      </Card>

      {pilotOverview && (
        <Card className="border-l-4 border-l-mc-blue-500">
          <CardHeader>
            <CardTitle>Pilote horaire</CardTitle>
            <Badge variant={pilotOverview.reviewCount === 0 ? 'green' : 'amber'}>
              {pilotOverview.activePseudocodeCount}/6 codes
            </Badge>
          </CardHeader>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-xl bg-[var(--bg-tertiary)] p-3">
              <p className="text-xs text-[var(--text-muted)]">Montant horaire</p>
              <p className="font-bold text-mc-green-500">€{pilotOverview.hourlyAmount.toFixed(0)}</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-tertiary)] p-3">
              <p className="text-xs text-[var(--text-muted)]">Écart vs forfait</p>
              <p className={`font-bold ${pilotOverview.deltaAmount >= 0 ? 'text-mc-green-500' : 'text-mc-red-500'}`}>
                {pilotOverview.deltaAmount >= 0 ? '+' : ''}€{pilotOverview.deltaAmount.toFixed(0)}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--bg-tertiary)] p-3">
              <p className="text-xs text-[var(--text-muted)]">Relectures</p>
              <p className="font-bold text-mc-amber-500">{pilotOverview.reviewCount}</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="border-l-4 border-l-mc-green-500">
        <CardHeader>
          <CardTitle>Billing autopilot</CardTitle>
          <Badge variant={autopilot && autopilot.blockedCount + autopilot.reviewCount + autopilot.recoveryCount > 0 ? 'amber' : 'green'}>
            {autopilot ? `${autopilot.automationRate}% automatisable` : 'Analyse'}
          </Badge>
        </CardHeader>

        {isAutopilotLoading ? (
          <p className="text-sm text-[var(--text-muted)]">Analyse des dossiers horaires et accords MyCareNet...</p>
        ) : autopilotError ? (
          <p className="text-sm text-mc-red-600">{(autopilotError as Error).message}</p>
        ) : autopilot ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-center text-sm">
              <div className="rounded-xl bg-[var(--bg-tertiary)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Prets</p>
                <p className="font-bold text-mc-green-500">{autopilot.readyCount}</p>
                <p className="text-[10px] text-[var(--text-muted)]">EUR {autopilot.readyAmount.toFixed(0)}</p>
              </div>
              <div className="rounded-xl bg-[var(--bg-tertiary)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Bloques</p>
                <p className="font-bold text-mc-amber-500">{autopilot.blockedCount}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Prerequis</p>
              </div>
              <div className="rounded-xl bg-[var(--bg-tertiary)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Relectures</p>
                <p className="font-bold text-mc-red-500">{autopilot.reviewCount}</p>
                <p className="text-[10px] text-[var(--text-muted)]">Controle</p>
              </div>
              <div className="rounded-xl bg-[var(--bg-tertiary)] p-3">
                <p className="text-xs text-[var(--text-muted)]">A risque</p>
                <p className="font-bold text-mc-blue-500">EUR {autopilot.atRiskAmount.toFixed(0)}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{autopilot.recoveryCount} relance(s)</p>
              </div>
            </div>

            <div className="rounded-xl bg-mc-blue-500/10 border border-mc-blue-500/20 p-3">
              <p className="text-sm font-medium">{autopilot.note}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                L autopilote priorise la relecture horaire, les accords MyCareNet a relancer et les dossiers deja exportables.
              </p>
            </div>

            <div className="space-y-2">
              {autopilot.items.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">Aucun dossier recent a prioriser.</p>
              ) : autopilot.items.map((item) => (
                <div key={item.id} className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{item.patientLabel}</p>
                        <Badge
                          variant={
                            item.lane === 'ready'
                              ? 'green'
                              : item.lane === 'review'
                                ? 'red'
                                : item.lane === 'recovery'
                                  ? 'blue'
                                  : 'amber'
                          }
                        >
                          {item.title}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {item.nurseLabel} · {item.mutualityLabel} · {new Date(item.generatedAt).toLocaleDateString('fr-BE')}
                      </p>
                      <p className="text-sm mt-2">{item.detail}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.tags.map((tag) => (
                          <Badge key={`${item.id}-${tag}`} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">EUR {item.amount.toFixed(2)}</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate(item.actionPath)}>
                        {item.actionLabel}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Activity Feed */}
        <Card>
          <CardHeader><CardTitle>Activité récente</CardTitle></CardHeader>
          <div className="space-y-3">
            {recentActivity.map(item => (
              <div key={item.id} className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                  {(() => {
                    const Icon = billingActivityIcons[item.icon];
                    return <Icon className={`h-3.5 w-3.5 ${item.color}`} />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{item.action}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{item.detail}</p>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* MyCareNet Status */}
        <Card>
          <CardHeader>
            <CardTitle>Connexion mutuelles</CardTitle>
            <Badge variant={gatewayHealthy ? 'green' : 'amber'} dot>{gatewayHealthy ? 'En ligne' : 'Dégradé'}</Badge>
          </CardHeader>
          <div className="space-y-2">
            {mutuelleStatus.map(m => (
              <div key={m.name} className="flex items-center justify-between py-1">
                <span className="text-xs">{m.name}</span>
                <div className="flex items-center gap-1">
                  {m.status === 'online' ? (
                    <><div className="h-2 w-2 rounded-full bg-mc-green-500" /><span className="text-[10px] text-mc-green-500">OK</span></>
                  ) : (
                    <><div className="h-2 w-2 rounded-full bg-mc-amber-500 animate-pulse" /><span className="text-[10px] text-mc-amber-500">Lent</span></>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-3 gap-1 text-xs" onClick={() => navigate('/billing/mutuelles')}>
            <Users className="h-3 w-3" /> Annuaire mutuelles
          </Button>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-l-4 border-l-mc-blue-500">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-mc-blue-500 to-mc-green-500 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">Insights IA — Tarification</p>
            <p className="text-[10px] text-[var(--text-muted)]">Analyse des 30 derniers jours</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <TrendingUp className="h-4 w-4 mt-0.5 shrink-0 text-mc-green-500" />
            <span>Le chiffre d’affaires mensuel progresse de {revenueGrowth}% — confirmez les actes les plus rentables avant clôture.</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-mc-amber-500" />
            <span>{kpis.rejections} rejets restent à traiter — priorisez les corrections sur les lots encore réémettables aujourd’hui.</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Euro className="h-4 w-4 mt-0.5 shrink-0 text-mc-blue-500" />
            <span>€{kpis.pendingAmount.toLocaleString('fr-BE')} restent en attente — surveillez surtout les flux mutuelle dégradés.</span>
          </div>
        </div>
      </Card>
    </AnimatedPage>
  );
}
