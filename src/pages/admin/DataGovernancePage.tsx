import { Database, FileText, Download, Users, Shield, Clock3, AlertTriangle, CheckCircle, Lock } from 'lucide-react';
import { Badge, Button, Card, CardHeader, CardTitle, AnimatedPage, GradientHeader } from '@/design-system';
import { useAdminPlatformData } from '@/hooks/usePlatformData';

const dsarTypeLabels = { access: 'Accès', rectification: 'Rectification', portability: 'Portabilité' } as const;

function parseBelgianDate(date: string) {
  const [day, month, year] = date.split('/').map(Number);
  return new Date(year, month - 1, day);
}

export function DataGovernancePage() {
  const { data } = useAdminPlatformData();
  const governance = data.dataGovernance;
  const openDsars = governance.dsarQueue.filter((item) => item.status !== 'completed').length;
  const soonestPendingRequest = governance.dsarQueue
    .filter((item) => item.status === 'pending')
    .sort((a, b) => parseBelgianDate(a.deadline).getTime() - parseBelgianDate(b.deadline).getTime())[0];
  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Database className="h-5 w-5" />}
        title="Gouvernance des données"
        subtitle="Registre Art.30, base légale, DSAR et sous-traitants"
        badge={<Badge variant="amber">{data.rgpd.registerCompletion}% complet</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{data.rgpd.registerCompletion}%</p>
            <p className="text-[10px] text-white/60">Registre complété</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{openDsars}</p>
            <p className="text-[10px] text-white/60">DSAR ouvertes</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{governance.processors.length}</p>
            <p className="text-[10px] text-white/60">Sous-traitants</p>
          </div>
        </div>
      </GradientHeader>

      <Card className="border-l-4 border-l-mc-amber-500">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-mc-amber-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Article 30 gap</p>
            <p className="text-xs text-[var(--text-muted)]">{governance.article30Notice}</p>
          </div>
          <Badge variant="amber">À compléter</Badge>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Registre des traitements</CardTitle>
            <Badge variant="blue">Art.30 RGPD</Badge>
          </CardHeader>
          <div className="space-y-3">
            {governance.processingRegister.map((item) => (
              <div key={item.activity} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{item.activity}</p>
                    <p className="text-xs text-[var(--text-muted)]">{item.lawfulBasis}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Owner {item.owner}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={item.status === 'ok' ? 'green' : 'amber'}>{item.completeness}</Badge>
                    <span className="text-[10px] text-[var(--text-muted)]">{item.status === 'ok' ? 'Documenté' : 'Partiel'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Queue DSAR</CardTitle>
            <Badge variant="outline">1 mois max</Badge>
          </CardHeader>
          <div className="space-y-2">
            {governance.dsarQueue.map((item) => {
              const dueSoon = item.status === 'pending' && item.id === soonestPendingRequest?.id;
              return (
              <div key={`${item.patient}-${item.type}`} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                <div className="flex items-center gap-3">
                  {item.type === 'portability' ? <Download className="h-4 w-4 text-mc-blue-500" /> : <FileText className="h-4 w-4 text-mc-blue-500" />}
                  <div>
                    <p className="text-sm font-medium">{item.patient}</p>
                    <p className="text-xs text-[var(--text-muted)]">{dsarTypeLabels[item.type]}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={item.status === 'completed' ? 'green' : dueSoon ? 'amber' : 'blue'}>
                    {item.status === 'completed' ? 'Traité' : dueSoon ? 'Échéance proche' : 'Ouvert'}
                  </Badge>
                  <span className="text-[10px] text-[var(--text-muted)]">Échéance {item.deadline}</span>
                </div>
              </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Sous-traitants & DPA</CardTitle>
            <Badge variant="green">EU only</Badge>
          </CardHeader>
          <div className="space-y-3">
            {governance.processors.map((processor) => (
              <div key={processor.name} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Users className="h-4 w-4 text-mc-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{processor.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{processor.scope}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={processor.dpa === 'Signé' ? 'green' : 'amber'}>{processor.dpa}</Badge>
                    <span className="text-[10px] text-[var(--text-muted)]">{processor.region}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rétention & ownership</CardTitle>
            <Badge variant="outline">Stewardship</Badge>
          </CardHeader>
          <div className="space-y-3">
            {governance.retentionControls.map((control) => (
              <div key={control.label} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {control.tone === 'green' ? <CheckCircle className="h-4 w-4 text-mc-green-500" /> : control.tone === 'amber' ? <Clock3 className="h-4 w-4 text-mc-amber-500" /> : <Lock className="h-4 w-4 text-mc-red-500" />}
                    <p className="text-sm font-medium">{control.label}</p>
                  </div>
                  <span className={`text-lg font-bold ${control.tone === 'green' ? 'text-mc-green-500' : control.tone === 'amber' ? 'text-mc-amber-500' : 'text-mc-red-500'}`}>{control.value}</span>
                </div>
              </div>
            ))}
            <div className="p-3 rounded-xl border border-dashed border-[var(--border-default)]">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-mc-blue-500 mt-0.5" />
                <p className="text-xs text-[var(--text-muted)]">Les exports temporaires du module reporting doivent être purgés automatiquement après validation de la nouvelle politique.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="justify-start">
          <FileText className="h-4 w-4" />
          Exporter le registre
        </Button>
        <Button variant="gradient" className="justify-start">
          <Database className="h-4 w-4" />
          Ouvrir revue DPO
        </Button>
      </div>
    </AnimatedPage>
  );
}
