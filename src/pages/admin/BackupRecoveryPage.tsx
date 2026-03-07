import { HardDrive, CheckCircle, AlertTriangle, Clock3, ShieldCheck, RotateCcw, Cloud, Server } from 'lucide-react';
import { Badge, Button, Card, CardHeader, CardTitle, AnimatedPage, GradientHeader } from '@/design-system';
import { useAdminPlatformData } from '@/hooks/usePlatformData';

export function BackupRecoveryPage() {
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
        subtitle="Snapshots, drills de restauration, RPO/RTO et préparation DR"
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
            <CardTitle>État des snapshots</CardTitle>
            <Badge variant="green">Immuables</Badge>
          </CardHeader>
          <div className="space-y-2">
            {snapshotStatus.map((item) => (
              <div key={item.workload} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                <div className="flex items-center gap-3">
                  {item.workload.toLowerCase().includes('documents') ? <Cloud className="h-4 w-4 text-mc-blue-500" /> : <Server className="h-4 w-4 text-mc-blue-500" />}
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
                    {item.readiness === 'ok' ? 'Prêt' : 'À renforcer'}
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
                    {drill.status === 'ok' ? <CheckCircle className="h-4 w-4 text-mc-green-500 mt-0.5" /> : <Clock3 className="h-4 w-4 text-mc-amber-500 mt-0.5" />}
                    <div>
                      <p className="text-sm font-medium">{drill.scenario}</p>
                      <p className="text-xs text-[var(--text-muted)]">{drill.date}</p>
                    </div>
                  </div>
                  <Badge variant={drill.status === 'ok' ? 'green' : 'amber'}>
                    {drill.status === 'ok' ? 'Validé' : 'Suivi'}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{drill.result}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Préparation DR</CardTitle>
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
        <Button variant="outline" className="justify-start">
          <RotateCcw className="h-4 w-4" />
          Lancer restore test
        </Button>
        <Button variant="gradient" className="justify-start">
          <HardDrive className="h-4 w-4" />
          Ouvrir readiness DR
        </Button>
      </div>
    </AnimatedPage>
  );
}
