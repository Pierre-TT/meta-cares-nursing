import { HeartHandshake, ShieldCheck, AlertTriangle, Link2, Eye, Clock3, CheckCircle, RefreshCw } from 'lucide-react';
import { Badge, Button, Card, CardHeader, CardTitle, AnimatedPage, GradientHeader } from '@/design-system';
import { useAdminPlatformData } from '@/hooks/usePlatformData';

export function ConsentRegistryPage() {
  const { data } = useAdminPlatformData();
  const consents = data.consents;
  const coveredAccess = Number(consents.accessAudit.find((item) => item.label.includes('couverts'))?.value ?? 0);
  const exclusionsTracked = Number(consents.accessAudit.find((item) => item.label.includes('exclusion'))?.value ?? 0);
  const totalAccessEvents = consents.accessAudit.reduce((sum, item) => sum + Number(item.value), 0);
  const coverage = totalAccessEvents > 0 ? Math.round((coveredAccess / totalAccessEvents) * 100) : 0;
  const syncGapCount = consents.syncGaps.filter((item) => item.severity !== 'green').length;
  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<HeartHandshake className="h-5 w-5" />}
        title="Registre des consentements"
        subtitle="Consentement éclairé, liens thérapeutiques, exclusions et contrôles d’accès"
        badge={<Badge variant="blue">{coverage}% couverture</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{coverage}%</p>
            <p className="text-[10px] text-white/60">Consentements actifs</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{exclusionsTracked}</p>
            <p className="text-[10px] text-white/60">Exclusions suivies</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{syncGapCount}</p>
            <p className="text-[10px] text-white/60">Sync gaps</p>
          </div>
        </div>
      </GradientHeader>

      <Card className="border-l-4 border-l-mc-amber-500">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-mc-amber-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Gap de synchronisation eHealth</p>
            <p className="text-xs text-[var(--text-muted)]">{consents.syncNotice}</p>
          </div>
          <Badge variant="amber">À confirmer</Badge>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Couverture patient</CardTitle>
          <Badge variant="outline">Consent & link</Badge>
        </CardHeader>
        <div className="space-y-3">
          {consents.patientConsents.map((row) => (
            <div key={row.patient} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{row.patient}</p>
                  <p className="text-xs text-[var(--text-muted)]">{row.exclusion}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Dernier sync {row.lastSync}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={row.consent === 'active' ? 'green' : row.consent === 'renewal' ? 'amber' : 'red'}>
                    {row.consent === 'active' ? 'Consent actif' : row.consent === 'renewal' ? 'À renouveler' : 'Absent'}
                  </Badge>
                  <Badge variant={row.therapeuticLink === 'ok' ? 'blue' : row.therapeuticLink === 'review' ? 'amber' : 'red'}>
                    {row.therapeuticLink === 'ok' ? 'Lien OK' : row.therapeuticLink === 'review' ? 'Lien à revoir' : 'Accès bloqué'}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Écarts de synchronisation</CardTitle>
            <Badge variant="amber">Interop</Badge>
          </CardHeader>
          <div className="space-y-3">
            {consents.syncGaps.map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {item.severity === 'green' ? <CheckCircle className="h-4 w-4 text-mc-green-500" /> : item.severity === 'amber' ? <Clock3 className="h-4 w-4 text-mc-amber-500" /> : <AlertTriangle className="h-4 w-4 text-mc-red-500" />}
                    <p className="text-sm font-medium">{item.label}</p>
                  </div>
                  <Badge variant={item.severity === 'green' ? 'green' : item.severity === 'amber' ? 'amber' : 'red'}>
                    {item.severity === 'green' ? 'OK' : item.severity === 'amber' ? 'Suivi' : 'Bloquant'}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{item.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compteurs d’audit</CardTitle>
            <Badge variant="green">24h</Badge>
          </CardHeader>
          <div className="space-y-3">
            {consents.accessAudit.map((item) => (
              <div key={item.label} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {item.tone === 'green' ? <ShieldCheck className="h-4 w-4 text-mc-green-500" /> : item.tone === 'amber' ? <Link2 className="h-4 w-4 text-mc-amber-500" /> : <Eye className="h-4 w-4 text-mc-blue-500" />}
                    <p className="text-sm font-medium">{item.label}</p>
                  </div>
                  <span className={`text-lg font-bold ${item.tone === 'green' ? 'text-mc-green-500' : item.tone === 'amber' ? 'text-mc-amber-500' : 'text-mc-blue-500'}`}>{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="justify-start">
          <RefreshCw className="h-4 w-4" />
          Re-synchroniser
        </Button>
        <Button variant="gradient" className="justify-start">
          <HeartHandshake className="h-4 w-4" />
          Ouvrir revue consentements
        </Button>
      </div>
    </AnimatedPage>
  );
}
