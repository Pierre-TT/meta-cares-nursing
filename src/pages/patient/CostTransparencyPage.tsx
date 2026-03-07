import { Euro, Shield, FileCheck, Download, Receipt } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, AnimatedPage, GradientHeader, ContentTabs, StatRing } from '@/design-system';

const invoices = [
  { id: 'i1', month: 'Février 2025', total: 847.20, inami: 720.12, ticket: 127.08, status: 'remboursé' as const },
  { id: 'i2', month: 'Janvier 2025', total: 892.50, inami: 758.63, ticket: 133.87, status: 'remboursé' as const },
  { id: 'i3', month: 'Mars 2025 (en cours)', total: 312.40, inami: 0, ticket: 0, status: 'en_cours' as const },
];

const efactHistory = [
  { id: 'e1', ref: 'EF-2025-0892', date: '01/03', amount: 847.20, status: 'remboursé' as const },
  { id: 'e2', ref: 'EF-2025-0756', date: '01/02', amount: 892.50, status: 'remboursé' as const },
  { id: 'e3', ref: 'EF-2025-0945', date: '06/03', amount: 312.40, status: 'envoyé' as const },
];

const efactStatus = { envoyé: 'blue' as const, accepté: 'amber' as const, remboursé: 'green' as const, en_cours: 'amber' as const };

export function CostTransparencyPage() {
  const latestInvoice = invoices[0];
  const annualTotal = invoices.reduce((s, i) => s + i.total, 0);
  const annualInami = invoices.reduce((s, i) => s + i.inami, 0);
  const annualTicket = invoices.reduce((s, i) => s + i.ticket, 0);

  const tabs = [
    {
      id: 'overview',
      label: 'Aperçu',
      content: (
        <div className="space-y-4">
          {/* Mutuelle coverage */}
          <Card className="border border-mc-green-200 dark:border-mc-green-800 bg-mc-green-50 dark:bg-mc-green-900/15">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-5 w-5 text-mc-green-500" />
              <div>
                <p className="text-sm font-bold">Couverture Mutuelle</p>
                <p className="text-[10px] text-[var(--text-muted)]">Mutualité Chrétienne — BIM</p>
              </div>
              <Badge variant="green" className="ml-auto">Actif</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 rounded-lg bg-white/50 dark:bg-white/5">
                <p className="text-lg font-bold text-mc-green-500">85%</p>
                <p className="text-[9px] text-[var(--text-muted)]">Intervention INAMI</p>
              </div>
              <div className="p-2 rounded-lg bg-white/50 dark:bg-white/5">
                <p className="text-lg font-bold text-mc-blue-500">BIM</p>
                <p className="text-[9px] text-[var(--text-muted)]">Statut préférentiel</p>
              </div>
              <div className="p-2 rounded-lg bg-white/50 dark:bg-white/5">
                <p className="text-lg font-bold">15%</p>
                <p className="text-[9px] text-[var(--text-muted)]">Ticket modérateur</p>
              </div>
            </div>
          </Card>

          {/* Monthly summary */}
          <Card>
            <CardHeader><CardTitle>Dernière facture — {latestInvoice.month}</CardTitle></CardHeader>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                <span className="text-sm">Total facturé</span>
                <span className="text-sm font-bold">€{latestInvoice.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                <span className="text-sm text-mc-green-500">Remboursé INAMI</span>
                <span className="text-sm font-bold text-mc-green-500">−€{latestInvoice.inami.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-sm font-bold">Reste à charge</span>
                <span className="text-sm font-black text-mc-amber-500">€{latestInvoice.ticket.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Annual summary */}
          <Card>
            <CardHeader><CardTitle>Résumé annuel 2025</CardTitle></CardHeader>
            <div className="flex items-center gap-4">
              <StatRing value={annualInami} max={annualTotal} label="Couvert" size={64} strokeWidth={5} />
              <div className="flex-1 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-[var(--text-muted)]">Total facturé</span><span className="font-bold">€{annualTotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-mc-green-500">Remboursé</span><span className="font-bold text-mc-green-500">€{annualInami.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-mc-amber-500">À charge</span><span className="font-bold text-mc-amber-500">€{annualTicket.toFixed(2)}</span></div>
              </div>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-2">Attestation fiscale disponible en janvier 2026</p>
          </Card>
        </div>
      ),
    },
    {
      id: 'efact',
      label: 'eFact',
      content: (
        <div className="space-y-2">
          <Card className="flex items-center gap-2 mb-2">
            <FileCheck className="h-4 w-4 text-mc-blue-500" />
            <p className="text-xs font-medium">Suivi de facturation électronique eFact</p>
          </Card>
          {efactHistory.map(ef => (
            <Card key={ef.id} padding="sm">
              <div className="flex items-center gap-3">
                <Receipt className="h-4 w-4 text-[var(--text-muted)]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{ef.ref}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{ef.date} · €{ef.amount.toFixed(2)}</p>
                </div>
                <Badge variant={efactStatus[ef.status]}>{ef.status === 'remboursé' ? 'Remboursé' : ef.status === 'envoyé' ? 'Envoyé' : 'Accepté'}</Badge>
              </div>
              {/* eFact timeline */}
              <div className="flex items-center gap-1 mt-2">
                {['Envoyé', 'Accepté', 'Remboursé'].map((step, i) => {
                  const stepIdx = ef.status === 'remboursé' ? 2 : (ef.status as string) === 'accepté' ? 1 : 0;
                  return (
                    <div key={step} className="flex-1 flex flex-col items-center">
                      <div className={`h-1.5 w-full rounded-full ${i <= stepIdx ? 'bg-mc-green-500' : 'bg-[var(--bg-tertiary)]'}`} />
                      <span className="text-[8px] text-[var(--text-muted)] mt-0.5">{step}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      ),
    },
    {
      id: 'payments',
      label: 'Paiements',
      content: (
        <div className="space-y-2">
          {invoices.filter(i => i.status === 'remboursé').map(inv => (
            <Card key={inv.id} padding="sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{inv.month}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Ticket modérateur: €{inv.ticket.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="green">Payé</Badge>
                  <Button variant="ghost" size="sm"><Download className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ),
    },
  ];

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<Euro className="h-5 w-5" />}
        title="Mes Coûts"
        subtitle="Transparence complète de vos soins"
        badge={<Badge variant="green">BIM</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">€{annualTotal.toFixed(0)}</p>
            <p className="text-[10px] text-white/60">Total 2025</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">85%</p>
            <p className="text-[10px] text-white/60">Remboursé</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">€{annualTicket.toFixed(0)}</p>
            <p className="text-[10px] text-white/60">À charge</p>
          </div>
        </div>
      </GradientHeader>

      <ContentTabs tabs={tabs} />
    </AnimatedPage>
  );
}
