import { Shield, CheckCircle, AlertTriangle, Clock3, FileText, Lock, Eye, Download, Users, Siren } from 'lucide-react';
import { Badge, Card, CardHeader, CardTitle, Button, AnimatedPage, GradientHeader } from '@/design-system';
import { useAdminPlatformData } from '@/hooks/usePlatformData';

const typeLabels = { access: 'Droit d’accès', rectification: 'Rectification', portability: 'Portabilité' };
const typeIcons = { access: Eye, rectification: FileText, portability: Download };

export function RGPDPage() {
  const { data } = useAdminPlatformData();
  const complianceChecks = data.rgpd.complianceChecks;
  const recentRequests = data.rgpd.requests;
  const okCount = complianceChecks.filter((c) => c.status === 'ok').length;
  const score = data.summary.complianceScore;
  const pendingDsar = data.summary.pendingDsars;
  const preIncidentCount = data.rgpd.governanceHighlights.filter((item) => item.title.toLowerCase().includes('pré-incident')).length;

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Shield className="h-5 w-5" />}
        title="Conformité RGPD"
        subtitle="DSAR, registre, incidents et gouvernance"
        badge={<Badge variant={score >= 90 ? 'green' : 'amber'}>{score}%</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{okCount}/{complianceChecks.length}</p>
            <p className="text-[10px] text-white/60">Contrôles OK</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{pendingDsar}</p>
            <p className="text-[10px] text-white/60">DSAR ouvertes</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{preIncidentCount}</p>
            <p className="text-[10px] text-white/60">Pré-incidents</p>
          </div>
        </div>
      </GradientHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-bold text-mc-blue-500">{data.rgpd.registerCompletion}%</p>
          <p className="text-[10px] text-[var(--text-muted)]">Registre Art.30</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-mc-green-500">{data.rgpd.requestsHandled}</p>
          <p className="text-[10px] text-[var(--text-muted)]">Demandes traitées</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-mc-amber-500">{data.rgpd.dpiaToReview}</p>
          <p className="text-[10px] text-[var(--text-muted)]">AIPD à revoir</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-mc-red-500">{data.rgpd.nextTrainingInDays} j</p>
          <p className="text-[10px] text-[var(--text-muted)]">Prochaine formation</p>
        </Card>
      </div>

      <Card className="border-l-4 border-l-mc-amber-500">
        <div className="flex items-start gap-3">
          <Clock3 className="h-4 w-4 text-mc-amber-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">SLA DSAR active</p>
            <p className="text-xs text-[var(--text-muted)]">{data.rgpd.slaNotice}</p>
          </div>
          <Badge variant="amber">30 j max</Badge>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contrôles de conformité</CardTitle>
          <Badge variant={score >= 90 ? 'green' : 'amber'}>{okCount}/{complianceChecks.length}</Badge>
        </CardHeader>
        <div className="space-y-3">
          {complianceChecks.map((check) => (
            <div key={check.id} className="flex items-start gap-3 py-1.5 border-b border-[var(--border-subtle)] last:border-0">
              {check.status === 'ok' ? (
                <CheckCircle className="h-5 w-5 text-mc-green-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-mc-amber-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{check.label}</p>
                <p className="text-xs text-[var(--text-muted)]">{check.description}</p>
              </div>
              <span className="text-xs text-[var(--text-muted)] shrink-0">{check.lastCheck}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Demandes des personnes concernées</CardTitle>
            <Badge variant="blue">Art.15-20</Badge>
          </CardHeader>
          <div className="space-y-2">
            {recentRequests.map((req) => {
              const Icon = typeIcons[req.type];
              return (
                <div key={req.id} className="flex items-center gap-3 py-1.5 border-b border-[var(--border-subtle)] last:border-0">
                  <Icon className="h-4 w-4 text-mc-blue-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{typeLabels[req.type]}</p>
                    <p className="text-xs text-[var(--text-muted)]">{req.patient} · reçu le {req.date}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Échéance {req.deadline}</p>
                  </div>
                  <Badge variant={req.status === 'completed' ? 'green' : 'amber'}>
                    {req.status === 'completed' ? 'Traité' : 'En cours'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gouvernance & incidents</CardTitle>
            <Badge variant="outline">DPO</Badge>
          </CardHeader>
          <div className="space-y-3">
            {data.rgpd.governanceHighlights.map((item) => {
              const Icon = item.tone === 'blue' ? Users : item.tone === 'green' ? Lock : Siren;
              return (
                <div key={item.title} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${item.tone === 'blue' ? 'text-mc-blue-500' : item.tone === 'green' ? 'text-mc-green-500' : 'text-mc-amber-500'}`} />
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
        <Button variant="outline" className="flex-col h-auto py-4">
          <Lock className="h-5 w-5 mb-1" />
          <span className="text-xs">Audit accès</span>
        </Button>
        <Button variant="outline" className="flex-col h-auto py-4">
          <Download className="h-5 w-5 mb-1" />
          <span className="text-xs">Export RGPD</span>
        </Button>
      </div>
    </AnimatedPage>
  );
}
