import { useState } from 'react';
import {
  HardDrive,
  CheckCircle,
  AlertTriangle,
  Clock3,
  ShieldCheck,
  RotateCcw,
  Cloud,
  Server,
} from 'lucide-react';
import { Badge, Button, Card, CardHeader, CardTitle, AnimatedPage, GradientHeader, Modal } from '@/design-system';
import { useAdminPlatformData } from '@/hooks/usePlatformData';

export function BackupRecoveryPage() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [restoreQueued, setRestoreQueued] = useState(false);
  const { data } = useAdminPlatformData();
  const snapshotStatus = data.backup.snapshots;
  const recoveryObjectives = data.backup.recoveryObjectives;
  const restoreDrills = data.backup.restoreDrills;
  const protectedSnapshots = snapshotStatus.filter((item) => item.status === 'ok').length;
  const laggingSnapshots = snapshotStatus.filter((item) => item.status === 'warning').length;
  const lastRestoreMinutes = Number.parseInt(restoreDrills[0]?.result ?? '0', 10) || 0;
  const targetRpo = recoveryObjectives[0]?.rpo ?? '15 min';

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<HardDrive className="h-5 w-5" />}
        title="Backup & recovery"
        subtitle="Snapshots, drills de restauration, RPO/RTO et preparation DR"
        badge={<Badge variant={laggingSnapshots > 0 ? 'amber' : 'green'}>{laggingSnapshots} flux en retard</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{protectedSnapshots}/{snapshotStatus.length}</p>
            <p className="text-[10px] text-white/60">Snapshots critiques</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{lastRestoreMinutes} min</p>
            <p className="text-[10px] text-white/60">Dernier restore drill</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{targetRpo}</p>
            <p className="text-[10px] text-white/60">RPO cible</p>
          </div>
        </div>
      </GradientHeader>

      {feedback && (
        <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-mc-blue-500/10 border border-mc-blue-500/20">
          <CheckCircle className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      {restoreQueued && (
        <Card className="border-l-4 border-l-mc-green-500">
          <div className="flex items-start gap-3">
            <RotateCcw className="h-4 w-4 text-mc-green-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Restore test planifie</p>
              <p className="text-xs text-[var(--text-muted)]">Scenario prioritaire aligne sur le runbook de reprise du cluster clinique.</p>
            </div>
            <Badge variant="green">Planifie</Badge>
          </div>
        </Card>
      )}

      <Card className="border-l-4 border-l-mc-amber-500">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-mc-amber-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Analytics lake lag</p>
            <p className="text-xs text-[var(--text-muted)]">{data.backup.lagNotice}</p>
          </div>
          <Badge variant="amber">Surveiller</Badge>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Etat des snapshots</CardTitle>
            <Badge variant="green">Immuables</Badge>
          </CardHeader>
          <div className="space-y-2">
            {snapshotStatus.map((item) => (
              <div key={item.workload} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                <div className="flex items-center gap-3">
                  {item.workload.toLowerCase().includes('documents') ? (
                    <Cloud className="h-4 w-4 text-mc-blue-500" />
                  ) : (
                    <Server className="h-4 w-4 text-mc-blue-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{item.workload}</p>
                    <p className="text-xs text-[var(--text-muted)]">{item.retention}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={item.status === 'ok' ? 'green' : 'amber'}>
                    {item.status === 'ok' ? 'OK' : 'Retard'}
                  </Badge>
                  <span className="text-[10px] text-[var(--text-muted)]">{item.lastSnapshot}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Objectifs de reprise</CardTitle>
            <Badge variant="outline">RPO / RTO</Badge>
          </CardHeader>
          <div className="space-y-3">
            {recoveryObjectives.map((item) => (
              <div key={item.system} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{item.system}</p>
                    <p className="text-xs text-[var(--text-muted)]">RPO {item.rpo} · RTO {item.rto}</p>
                  </div>
                  <Badge variant={item.readiness === 'ok' ? 'green' : 'amber'}>
                    {item.readiness === 'ok' ? 'Pret' : 'A renforcer'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Restore drills</CardTitle>
            <Badge variant="blue">Historique</Badge>
          </CardHeader>
          <div className="space-y-3">
            {restoreDrills.map((drill) => (
              <div key={drill.scenario} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2">
                    {drill.status === 'ok' ? (
                      <CheckCircle className="h-4 w-4 text-mc-green-500 mt-0.5" />
                    ) : (
                      <Clock3 className="h-4 w-4 text-mc-amber-500 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{drill.scenario}</p>
                      <p className="text-xs text-[var(--text-muted)]">{drill.date}</p>
                    </div>
                  </div>
                  <Badge variant={drill.status === 'ok' ? 'green' : 'amber'}>
                    {drill.status === 'ok' ? 'Valide' : 'Suivi'}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{drill.result}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preparation DR</CardTitle>
            <Badge variant="green">Runbooks</Badge>
          </CardHeader>
          <div className="space-y-3">
            {data.backup.preparedness.map((item) => {
              const Icon = item.tone === 'green' ? ShieldCheck : RotateCcw;
              return (
                <div key={item.title} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${item.tone === 'green' ? 'text-mc-green-500' : 'text-mc-blue-500'}`} />
                    <p className="text-sm font-medium">{item.title}</p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="justify-start"
          onClick={() => {
            setRestoreQueued(true);
            setFeedback('Restore test ajoute a la file operations.');
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Lancer restore test
        </Button>
        <Button variant="gradient" className="justify-start" onClick={() => setReadinessOpen(true)}>
          <HardDrive className="h-4 w-4" />
          Ouvrir readiness DR
        </Button>
      </div>

      <Modal open={readinessOpen} onClose={() => setReadinessOpen(false)} title="Readiness DR">
        <div className="space-y-4">
          <div className="space-y-3">
            {recoveryObjectives.map((item) => (
              <div key={item.system} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{item.system}</p>
                    <p className="text-xs text-[var(--text-muted)]">RPO {item.rpo} · RTO {item.rto}</p>
                  </div>
                  <Badge variant={item.readiness === 'ok' ? 'green' : 'amber'}>
                    {item.readiness === 'ok' ? 'Pret' : 'A renforcer'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setReadinessOpen(false)}>Fermer</Button>
          </div>
        </div>
      </Modal>
    </AnimatedPage>
  );
}
