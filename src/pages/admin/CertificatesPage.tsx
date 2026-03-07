import { KeyRound, ShieldCheck, AlertCircle, ServerCog, Clock3, CheckCircle, RefreshCw } from 'lucide-react';
import { Badge, Button, Card, CardHeader, CardTitle, AnimatedPage, GradientHeader } from '@/design-system';
import { useAdminPlatformData } from '@/hooks/usePlatformData';

function daysUntil(date: string) {
  const [day, month, year] = date.split('/').map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.ceil((target.getTime() - currentDate.getTime()) / 86400000));
}

export function CertificatesPage() {
  const { data } = useAdminPlatformData();
  const certificates = data.certificates.inventory;
  const trustChecks = data.certificates.trustChecks;
  const approvals = data.certificates.approvals;
  const renewalsSoon = certificates.filter((certificate) => certificate.status !== 'ok').length;
  const approvedCount = approvals.filter((approval) => approval.status === 'approved').length;
  const nextRenewal = certificates.find((certificate) => certificate.status === 'expiring') ?? certificates.find((certificate) => certificate.status === 'warning');
  const renewalCountdown = nextRenewal ? daysUntil(nextRenewal.expires) : null;
  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<KeyRound className="h-5 w-5" />}
        title="Certificats & homologations"
        subtitle="Inventaire eHealth/MyCareNet, confiance et cycle de renouvellement"
        badge={<Badge variant="amber">{renewalsSoon} renouvellements proches</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{certificates.length}</p>
            <p className="text-[10px] text-white/60">Certificats suivis</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{renewalsSoon}</p>
            <p className="text-[10px] text-white/60">Avant 60 jours</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{approvedCount}/{approvals.length}</p>
            <p className="text-[10px] text-white/60">Homologations OK</p>
          </div>
        </div>
      </GradientHeader>

      <Card className="border-l-4 border-l-mc-amber-500">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-mc-amber-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Fenêtre de renouvellement ouverte</p>
            <p className="text-xs text-[var(--text-muted)]">{data.certificates.renewalNotice}</p>
          </div>
          <Badge variant="amber">{renewalCountdown !== null ? `J-${renewalCountdown}` : 'Stable'}</Badge>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Inventaire certificats</CardTitle>
            <Badge variant="blue">eHealth</Badge>
          </CardHeader>
          <div className="space-y-3">
            {certificates.map((certificate) => (
              <div key={certificate.name} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {certificate.status === 'ok' ? <ShieldCheck className="h-4 w-4 text-mc-green-500 mt-0.5" /> : certificate.status === 'warning' ? <Clock3 className="h-4 w-4 text-mc-amber-500 mt-0.5" /> : <AlertCircle className="h-4 w-4 text-mc-red-500 mt-0.5" />}
                    <div>
                      <p className="text-sm font-medium">{certificate.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{certificate.usage}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Owner {certificate.owner}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={certificate.environment === 'Prod' ? 'red' : 'blue'}>{certificate.environment}</Badge>
                    <span className="text-[10px] text-[var(--text-muted)]">Expire {certificate.expires}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chaîne de confiance</CardTitle>
            <Badge variant="green">Monitoring</Badge>
          </CardHeader>
          <div className="space-y-2">
            {trustChecks.map((check) => (
              <div key={check.label} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                <div className="flex items-center gap-3">
                  {check.state === 'ok' ? <CheckCircle className="h-4 w-4 text-mc-green-500" /> : <AlertCircle className="h-4 w-4 text-mc-amber-500" />}
                  <div>
                    <p className="text-sm font-medium">{check.label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{check.detail}</p>
                  </div>
                </div>
                <Badge variant={check.state === 'ok' ? 'green' : 'amber'}>
                  {check.state === 'ok' ? 'OK' : 'Action'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>États d’homologation</CardTitle>
          <Badge variant="outline">Prod & test</Badge>
        </CardHeader>
        <div className="space-y-3">
          {approvals.map((approval) => (
            <div key={approval.surface} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-3">
                <ServerCog className="h-4 w-4 text-mc-blue-500" />
                <div>
                  <p className="text-sm font-medium">{approval.surface}</p>
                  <p className="text-xs text-[var(--text-muted)]">{approval.detail}</p>
                </div>
              </div>
              <Badge variant={approval.status === 'approved' ? 'green' : 'amber'}>
                {approval.status === 'approved' ? 'Validé' : 'En revue'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="justify-start">
          <RefreshCw className="h-4 w-4" />
          Rafraîchir la PKI
        </Button>
        <Button variant="gradient" className="justify-start">
          <KeyRound className="h-4 w-4" />
          Préparer renouvellement
        </Button>
      </div>
    </AnimatedPage>
  );
}
