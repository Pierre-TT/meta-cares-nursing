import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  Wifi,
  RefreshCw,
  BarChart3,
  ShieldCheck,
  KeyRound,
  ServerCog,
} from 'lucide-react';
import { Badge, Button, Card, CardHeader, CardTitle, AnimatedPage, GradientHeader, Modal } from '@/design-system';

const services = [
  { name: 'eFact (facturation)', status: 'ok', latency: '120ms', lastCheck: '09:15', uptime: '99.8%' },
  { name: 'eAgreement (accords)', status: 'ok', latency: '95ms', lastCheck: '09:15', uptime: '99.5%' },
  { name: 'eAttest (attestations)', status: 'ok', latency: '110ms', lastCheck: '09:15', uptime: '99.7%' },
  { name: 'MemberData (assurabilite)', status: 'ok', latency: '85ms', lastCheck: '09:15', uptime: '99.9%' },
  { name: 'Chap IV (accords medicaments)', status: 'warning', latency: '340ms', lastCheck: '09:10', uptime: '97.2%' },
];

const dependencyStatus = [
  { name: 'Homologation production', state: 'approved', detail: 'Dossier valide le 12/01/2026' },
  { name: 'Certificat eHealth prod', state: 'expiring', detail: 'Expire le 25/03/2026' },
  { name: 'Certificat test', state: 'ok', detail: 'Valide jusqu au 18/12/2026' },
  { name: 'Chaine de confiance', state: 'ok', detail: 'Aucune alerte CRL/OCSP' },
];

const volumeStats = [
  { label: 'Transactions 24h', value: 1428, tone: 'blue' as const },
  { label: 'Rejets 24h', value: 11, tone: 'amber' as const },
  { label: 'Echecs reseau', value: 2, tone: 'red' as const },
  { label: 'Relances auto', value: 18, tone: 'green' as const },
];

const recentTransactions = [
  { type: 'eFact', direction: 'OUT', count: 12, status: 'accepted', time: '09:10' },
  { type: 'MemberData', direction: 'IN', count: 3, status: 'ok', time: '09:05' },
  { type: 'eFact', direction: 'IN', count: 12, status: '11 accepted, 1 rejected', time: '09:02' },
  { type: 'eAgreement', direction: 'OUT', count: 1, status: 'pending', time: '08:45' },
];

function buildRefreshLabel(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function MyCareNetPage() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorsOpen, setErrorsOpen] = useState(false);
  const flaggedTransactions = recentTransactions.filter((transaction) => !['accepted', 'ok'].includes(transaction.status));

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Wifi className="h-5 w-5" />}
        title="MyCareNet & dependances"
        subtitle="Supervision des flux, homologations et certificats"
        badge={<Badge variant="green" dot>Operationnel</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{services.filter((service) => service.status === 'ok').length}/{services.length}</p>
            <p className="text-[10px] text-white/60">Services OK</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">120ms</p>
            <p className="text-[10px] text-white/60">Latence moy.</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">99.2%</p>
            <p className="text-[10px] text-white/60">Uptime</p>
          </div>
        </div>
      </GradientHeader>

      {feedback && (
        <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-mc-blue-500/10 border border-mc-blue-500/20">
          <CheckCircle className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {volumeStats.map((item) => (
          <Card key={item.label} className="text-center">
            <p className={`text-2xl font-bold ${item.tone === 'blue' ? 'text-mc-blue-500' : item.tone === 'green' ? 'text-mc-green-500' : item.tone === 'red' ? 'text-mc-red-500' : 'text-mc-amber-500'}`}>
              {item.value}
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">{item.label}</p>
          </Card>
        ))}
      </div>

      <Card className="border-l-4 border-l-mc-amber-500">
        <div className="flex items-start gap-3">
          <KeyRound className="h-4 w-4 text-mc-amber-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold">Fenetre de renouvellement ouverte</p>
            <p className="text-xs text-[var(--text-muted)]">
              Le certificat production et l homologation associee doivent etre revus avant la fin mars.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/certificates')}>
            Preparer
          </Button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Services MyCareNet</CardTitle>
            <Badge variant="green" dot>Operationnel</Badge>
          </CardHeader>
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  {service.status === 'ok' ? (
                    <CheckCircle className="h-4 w-4 text-mc-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-mc-amber-500" />
                  )}
                  <div>
                    <span className="text-sm">{service.name}</span>
                    <p className="text-[10px] text-[var(--text-muted)]">Dernier check {service.lastCheck}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={service.status === 'ok' ? 'green' : 'amber'}>{service.latency}</Badge>
                  <span className="text-xs text-[var(--text-muted)]">{service.uptime}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Homologation & certificats</CardTitle>
            <Badge variant="blue">Compliance</Badge>
          </CardHeader>
          <div className="space-y-3">
            {dependencyStatus.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-2">
                  {item.state === 'ok' ? (
                    <ShieldCheck className="h-4 w-4 text-mc-green-500" />
                  ) : item.state === 'approved' ? (
                    <ServerCog className="h-4 w-4 text-mc-blue-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-mc-amber-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{item.detail}</p>
                  </div>
                </div>
                <Badge variant={item.state === 'ok' ? 'green' : item.state === 'approved' ? 'blue' : 'amber'}>
                  {item.state === 'ok' ? 'OK' : item.state === 'approved' ? 'Valide' : 'Expire'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions recentes</CardTitle>
          <Badge variant="outline">24h</Badge>
        </CardHeader>
        <div className="space-y-2">
          {recentTransactions.map((transaction, index) => (
            <div key={`${transaction.type}-${index}`} className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] last:border-0 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={transaction.direction === 'OUT' ? 'blue' : 'green'}>{transaction.direction}</Badge>
                <span>{transaction.type}</span>
                <span className="text-xs text-[var(--text-muted)]">x{transaction.count}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">{transaction.status}</span>
                <span className="text-xs text-[var(--text-muted)]">{transaction.time}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="justify-start"
          onClick={() => setFeedback(`Flux rafraichis a ${buildRefreshLabel()}.`)}
        >
          <RefreshCw className="h-4 w-4" />
          Rafraichir les flux
        </Button>
        <Button variant="gradient" className="justify-start" onClick={() => setErrorsOpen(true)}>
          <BarChart3 className="h-4 w-4" />
          Voir les erreurs
        </Button>
      </div>

      <Modal open={errorsOpen} onClose={() => setErrorsOpen(false)} title="Erreurs & relances">
        <div className="space-y-4">
          <div className="space-y-3">
            {flaggedTransactions.map((transaction) => (
              <div key={`${transaction.type}-${transaction.time}`} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{transaction.type}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {transaction.direction} · {transaction.status}
                    </p>
                  </div>
                  <Badge variant={transaction.status.includes('rejected') ? 'amber' : 'blue'}>
                    {transaction.time}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setErrorsOpen(false)}>
              Fermer
            </Button>
            <Button
              onClick={() => {
                setErrorsOpen(false);
                navigate('/admin/audit');
              }}
            >
              Ouvrir audit
            </Button>
          </div>
        </div>
      </Modal>
    </AnimatedPage>
  );
}
