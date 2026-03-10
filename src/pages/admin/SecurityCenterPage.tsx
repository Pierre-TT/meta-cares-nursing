import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  KeyRound,
  Lock,
  Smartphone,
  Laptop,
  TriangleAlert,
  CheckCircle,
  Clock3,
} from 'lucide-react';
import { Badge, Button, Card, CardHeader, CardTitle, AnimatedPage, GradientHeader, Modal } from '@/design-system';
import { useAdminPlatformData } from '@/hooks/usePlatformData';

export function SecurityCenterPage() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const { data } = useAdminPlatformData();
  const activeRiskCount = data.security.privilegedAccounts.filter((account) => account.risk !== 'low').length;
  const reviewAccounts = data.security.privilegedAccounts.filter((account) => account.risk !== 'low');

  function openAuditQueue() {
    setReviewOpen(false);
    navigate('/admin/audit');
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Shield className="h-5 w-5" />}
        title="Security Center"
        subtitle="Acces privilegies, MFA, sessions et confiance des appareils"
        badge={<Badge variant="red">{activeRiskCount} risques actifs</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{data.summary.mfaCoverage}%</p>
            <p className="text-[10px] text-white/60">MFA couverte</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{data.security.privilegedAccounts.length}</p>
            <p className="text-[10px] text-white/60">Comptes sensibles</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{data.security.riskySessions.length}</p>
            <p className="text-[10px] text-white/60">Sessions a revoir</p>
          </div>
        </div>
      </GradientHeader>

      {feedback && (
        <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-mc-blue-500/10 border border-mc-blue-500/20">
          <CheckCircle className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      <Card className="border-l-4 border-l-mc-red-500">
        <div className="flex items-start gap-3">
          <TriangleAlert className="h-4 w-4 text-mc-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Break-glass account review required</p>
            <p className="text-xs text-[var(--text-muted)]">{data.security.breakGlassNotice}</p>
          </div>
          <Badge variant="red">Urgent</Badge>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Acces privilegies</CardTitle>
            <Badge variant="blue">Recertification</Badge>
          </CardHeader>
          <div className="space-y-3">
            {data.security.privilegedAccounts.map((account) => (
              <div key={account.name} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <KeyRound className="h-4 w-4 text-mc-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{account.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{account.scope}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Derniere elevation {account.lastElevation}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={account.risk === 'high' ? 'red' : account.risk === 'medium' ? 'amber' : 'green'}>
                      {account.risk === 'high' ? 'Risque eleve' : account.risk === 'medium' ? 'A surveiller' : 'Conforme'}
                    </Badge>
                    <Badge variant={account.mfa === 'strong' ? 'green' : account.mfa === 'review' ? 'amber' : 'outline'}>
                      {account.mfa === 'strong' ? 'MFA forte' : account.mfa === 'review' ? 'MFA revue' : 'Vault'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sessions a risque</CardTitle>
            <Badge variant="amber">UEBA mock</Badge>
          </CardHeader>
          <div className="space-y-3">
            {data.security.riskySessions.map((session) => (
              <div key={`${session.user}-${session.signal}`} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{session.user}</p>
                    <p className="text-xs text-[var(--text-muted)]">{session.context}</p>
                  </div>
                  <Badge variant={session.severity === 'high' ? 'red' : 'amber'}>{session.score}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <TriangleAlert className={`h-4 w-4 ${session.severity === 'high' ? 'text-mc-red-500' : 'text-mc-amber-500'}`} />
                  <p className="text-xs text-[var(--text-muted)]">{session.signal}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Confiance appareils</CardTitle>
            <Badge variant="outline">MDM</Badge>
          </CardHeader>
          <div className="space-y-2">
            {data.security.trustedDevices.map((device) => (
              <div key={device.label} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                <div className="flex items-center gap-3">
                  {device.label.toLowerCase().includes('android') ? (
                    <Smartphone className="h-4 w-4 text-mc-blue-500" />
                  ) : (
                    <Laptop className="h-4 w-4 text-mc-blue-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{device.label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{device.owner}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={device.state === 'trusted' ? 'green' : device.state === 'review' ? 'amber' : 'red'}>
                    {device.state === 'trusted' ? 'Trusted' : device.state === 'review' ? 'Review' : 'Blocked'}
                  </Badge>
                  <span className="text-[10px] text-[var(--text-muted)]">{device.lastSeen}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Methodes d authentification</CardTitle>
            <Badge variant="green">Objectif 2026</Badge>
          </CardHeader>
          <div className="space-y-3">
            {data.security.authMix.map((item) => (
              <div key={item.method} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {item.method.includes('cle') ? (
                      <Lock className="h-4 w-4 text-mc-green-500" />
                    ) : item.method.includes('service') ? (
                      <Clock3 className="h-4 w-4 text-mc-amber-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-mc-blue-500" />
                    )}
                    <p className="text-sm font-medium">{item.method}</p>
                  </div>
                  <span className="text-sm font-bold">{item.adoption}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{item.posture}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="justify-start"
          onClick={() => {
            setReviewOpen(true);
            setFeedback('Revue trimestrielle prete a lancer.');
          }}
        >
          <Lock className="h-4 w-4" />
          Lancer revue trimestrielle
        </Button>
        <Button
          variant="gradient"
          className="justify-start"
          onClick={() => {
            setFeedback('Simulation redirigee vers le centre incidents.');
            navigate('/admin/incidents');
          }}
        >
          <Shield className="h-4 w-4" />
          Simuler incident d acces
        </Button>
      </div>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Revue trimestrielle">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Comptes a recertifier ou a sortir du perimetre privilegie avant la prochaine revue.
          </p>

          <div className="space-y-3">
            {reviewAccounts.map((account) => (
              <div key={account.name} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{account.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{account.scope}</p>
                  </div>
                  <Badge variant={account.risk === 'high' ? 'red' : 'amber'}>
                    {account.risk === 'high' ? 'Risque eleve' : 'A surveiller'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReviewOpen(false)}>
              Fermer
            </Button>
            <Button onClick={openAuditQueue}>Ouvrir audit</Button>
          </div>
        </div>
      </Modal>
    </AnimatedPage>
  );
}
