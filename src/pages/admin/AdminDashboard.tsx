import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BellRing,
  Clock3,
  Database,
  HardDrive,
  KeyRound,
  Lock,
  Server,
  ShieldCheck,
} from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  AnimatedPage,
  GradientHeader,
  Modal,
  StatRing,
} from '@/design-system';
import { useAdminPlatformData } from '@/hooks/usePlatformData';

function getRecoveryIcon(label: string) {
  if (label.toLowerCase().includes('snapshot')) return HardDrive;
  if (label.toLowerCase().includes('restore')) return Database;
  if (label.toLowerCase().includes('chiffrement')) return Lock;
  return Clock3;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const { data } = useAdminPlatformData();
  const { summary, certificateBanner, serviceHealth, riskQueues, recentActivity, recoveryHighlights } = data;

  function openRoute(path: string) {
    setAlertsOpen(false);
    navigate(path);
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<ShieldCheck className="h-5 w-5" />}
        title="Command center admin"
        subtitle="Securite, conformite et operations plateforme"
        badge={<Badge variant="green" dot>Plateforme stable</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{summary.userCount}</p>
            <p className="text-[10px] text-white/60">Utilisateurs</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{summary.alertCount}</p>
            <p className="text-[10px] text-white/60">Alertes</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{summary.certificateDeadlines}</p>
            <p className="text-[10px] text-white/60">Echeances certif.</p>
          </div>
        </div>
      </GradientHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="flex flex-col items-center py-3">
          <StatRing value={summary.uptime} max={100} label="Uptime" suffix="%" color="green" />
        </Card>
        <Card className="flex flex-col items-center py-3">
          <StatRing value={summary.complianceScore} max={100} label="Conformite" suffix="%" color="blue" />
        </Card>
        <Card className="flex flex-col items-center py-3">
          <StatRing value={summary.mfaCoverage} max={100} label="MFA" suffix="%" color="amber" />
        </Card>
        <Card className="flex flex-col items-center py-3">
          <StatRing value={summary.backupReadiness} max={100} label="Recovery" suffix="%" color="gradient" />
        </Card>
      </div>

      <Card className="border-l-4 border-l-mc-amber-500">
        <div className="flex items-start gap-3">
          <KeyRound className="h-4 w-4 text-mc-amber-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">{certificateBanner.title}</p>
            <p className="text-xs text-[var(--text-muted)]">{certificateBanner.detail}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/certificates')}>
            Voir certificats
          </Button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Sante des dependances</CardTitle>
            <Badge variant="green">{serviceHealth.length} services</Badge>
          </CardHeader>
          <div className="space-y-3">
            {serviceHealth.map((svc) => (
              <div key={svc.name} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-2">
                  {svc.status === 'ok' ? (
                    <Server className="h-4 w-4 text-mc-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-mc-amber-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{svc.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Latence {svc.latency}</p>
                  </div>
                </div>
                <Badge variant={svc.status === 'ok' ? 'green' : 'amber'}>{svc.uptime}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Files de risque</CardTitle>
            <Badge variant="amber">Prioritaire</Badge>
          </CardHeader>
          <div className="space-y-3">
            {riskQueues.map((item) => (
              <div key={item.title} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <Badge variant={item.severity}>{item.count}</Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Resilience & reprise</CardTitle>
            <Badge variant="green">RPO 15 min</Badge>
          </CardHeader>
          <div className="space-y-3">
            {recoveryHighlights.map((row) => {
              const Icon = getRecoveryIcon(row.label);
              return (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${row.tone === 'green' ? 'text-mc-green-500' : row.tone === 'blue' ? 'text-mc-blue-500' : 'text-mc-amber-500'}`} />
                    <span className="text-sm">{row.label}</span>
                  </div>
                  <span className="text-xs font-medium">{row.value}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activite critique recente</CardTitle>
            <Badge variant="blue">Temps reel</Badge>
          </CardHeader>
          <div className="space-y-2">
            {recentActivity.map((item) => (
              <div key={`${item.user}-${item.action}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors">
                <Avatar name={item.user} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.action}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{item.user} · {item.role}</p>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="justify-start" onClick={() => setAlertsOpen(true)}>
          <BellRing className="h-4 w-4" />
          Ouvrir centre d alertes
        </Button>
        <Button variant="gradient" className="justify-start" onClick={() => navigate('/admin/incidents')}>
          <Activity className="h-4 w-4" />
          Voir incidents & DSAR
        </Button>
      </div>

      <Modal open={alertsOpen} onClose={() => setAlertsOpen(false)} title="Centre d alertes" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Suivi prioritaire des risques ouverts, des incidents en cours et des demandes de conformite.
          </p>

          <div className="space-y-3">
            {riskQueues.length > 0 ? (
              riskQueues.map((item) => (
                <div key={item.title} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-[var(--text-muted)]">{item.detail}</p>
                    </div>
                    <Badge variant={item.severity}>{item.count}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Aucune alerte prioritaire n est ouverte.</p>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Button variant="outline" onClick={() => openRoute('/admin/certificates')}>
              Certificats
            </Button>
            <Button variant="primary" onClick={() => openRoute('/admin/incidents')}>
              Incidents
            </Button>
            <Button variant="secondary" onClick={() => openRoute('/admin/rgpd')}>
              DSAR & RGPD
            </Button>
          </div>
        </div>
      </Modal>
    </AnimatedPage>
  );
}
