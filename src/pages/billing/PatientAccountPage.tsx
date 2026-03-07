import { useState } from 'react';
import { User, Search, FileText, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Badge, Button, Input, AnimatedPage, GradientHeader, Tabs } from '@/design-system';

interface PatientAccount {
  id: string;
  name: string;
  niss: string;
  mutuelle: string;
  mutuelleCode: string;
  agreementStatus: 'active' | 'expired' | 'pending' | 'none';
  agreementEnd?: string;
  forfaitType: 'A' | 'B' | 'C' | null;
  totalBilled: number;
  totalPaid: number;
  ticketModerateur: number;
  lastVisit: string;
  visits: number;
  invoices: { id: string; date: string; amount: number; status: 'paid' | 'pending' | 'rejected' }[];
}

const patients: PatientAccount[] = [
  {
    id: 'P001', name: 'Marie-Claire Devos', niss: '52.01.15-123.45', mutuelle: 'Mutualité Chrétienne', mutuelleCode: '100',
    agreementStatus: 'active', agreementEnd: '2026-09-30', forfaitType: 'B', totalBilled: 2456.80, totalPaid: 2210.12, ticketModerateur: 246.68,
    lastVisit: '2026-03-05', visits: 68,
    invoices: [
      { id: 'INV-0412', date: '2026-03-01', amount: 435.20, status: 'paid' },
      { id: 'INV-0398', date: '2026-02-01', amount: 398.60, status: 'paid' },
      { id: 'INV-0385', date: '2026-01-01', amount: 412.00, status: 'pending' },
    ]
  },
  {
    id: 'P002', name: 'Jean-Pierre Lemaire', niss: '45.07.22-456.78', mutuelle: 'Solidaris', mutuelleCode: '300',
    agreementStatus: 'expired', agreementEnd: '2026-02-28', forfaitType: 'C', totalBilled: 4120.50, totalPaid: 3708.45, ticketModerateur: 412.05,
    lastVisit: '2026-03-04', visits: 112,
    invoices: [
      { id: 'INV-0410', date: '2026-03-01', amount: 680.90, status: 'pending' },
      { id: 'INV-0395', date: '2026-02-01', amount: 645.30, status: 'paid' },
      { id: 'INV-0380', date: '2026-01-01', amount: 670.10, status: 'rejected' },
    ]
  },
  {
    id: 'P003', name: 'Françoise Hendrickx', niss: '38.11.03-789.01', mutuelle: 'Partenamut', mutuelleCode: '500',
    agreementStatus: 'active', agreementEnd: '2026-12-31', forfaitType: 'A', totalBilled: 1245.30, totalPaid: 1120.77, ticketModerateur: 124.53,
    lastVisit: '2026-03-06', visits: 34,
    invoices: [
      { id: 'INV-0415', date: '2026-03-01', amount: 215.40, status: 'paid' },
      { id: 'INV-0400', date: '2026-02-01', amount: 198.80, status: 'paid' },
    ]
  },
  {
    id: 'P004', name: 'Robert Van den Berg', niss: '42.05.18-234.56', mutuelle: 'Mutualités Libres', mutuelleCode: '600',
    agreementStatus: 'pending', forfaitType: null, totalBilled: 890.20, totalPaid: 623.14, ticketModerateur: 267.06,
    lastVisit: '2026-03-03', visits: 22,
    invoices: [
      { id: 'INV-0408', date: '2026-03-01', amount: 156.80, status: 'pending' },
      { id: 'INV-0392', date: '2026-02-01', amount: 142.40, status: 'paid' },
    ]
  },
  {
    id: 'P005', name: 'Isabelle Claessens', niss: '60.09.27-567.89', mutuelle: 'Mutualité Neutre', mutuelleCode: '200',
    agreementStatus: 'none', forfaitType: null, totalBilled: 345.60, totalPaid: 276.48, ticketModerateur: 69.12,
    lastVisit: '2026-02-28', visits: 8,
    invoices: [
      { id: 'INV-0390', date: '2026-02-01', amount: 178.20, status: 'paid' },
      { id: 'INV-0372', date: '2026-01-01', amount: 167.40, status: 'paid' },
    ]
  },
];

const agreementConfig: Record<string, { label: string; variant: 'green' | 'red' | 'amber' | 'blue' }> = {
  active: { label: 'Accord actif', variant: 'green' },
  expired: { label: 'Accord expiré', variant: 'red' },
  pending: { label: 'En demande', variant: 'amber' },
  none: { label: 'Sans accord', variant: 'blue' },
};

const invoiceStatusConfig: Record<string, { label: string; variant: 'green' | 'red' | 'amber' }> = {
  paid: { label: 'Payé', variant: 'green' },
  pending: { label: 'En attente', variant: 'amber' },
  rejected: { label: 'Rejeté', variant: 'red' },
};

const tabs = [
  { id: 'all', label: 'Tous' },
  { id: 'active', label: 'Accord actif' },
  { id: 'expired', label: 'Expiré' },
  { id: 'pending', label: 'En demande' },
];

function fmt(n: number) { return n.toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' }); }

export function PatientAccountPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = patients.filter(p => {
    if (activeTab !== 'all' && p.agreementStatus !== activeTab) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.niss.includes(search)) return false;
    return true;
  });

  const totalTicket = patients.reduce((s, p) => s + p.ticketModerateur, 0);
  const totalBilled = patients.reduce((s, p) => s + p.totalBilled, 0);

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<User className="h-5 w-5" />}
        title="Comptes patients"
        subtitle="Historique facturation & accords"
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{patients.length}</p>
            <p className="text-[10px] text-white/60">Patients</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-green-300">{fmt(totalBilled)}</p>
            <p className="text-[10px] text-white/60">Total facturé</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-amber-300">{fmt(totalTicket)}</p>
            <p className="text-[10px] text-white/60">Tickets mod.</p>
          </div>
        </div>
      </GradientHeader>

      <Input icon={<Search className="h-4 w-4" />} placeholder="Rechercher patient (nom ou NISS)…" value={search} onChange={e => setSearch(e.target.value)} />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="text-center py-8">
            <User className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm">Aucun patient trouvé</p>
          </Card>
        ) : filtered.map(patient => {
          const agCfg = agreementConfig[patient.agreementStatus];
          return (
            <Card key={patient.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === patient.id ? null : patient.id)}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#47B6FF] to-[#4ABD33] flex items-center justify-center text-white text-sm font-bold">
                  {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{patient.name}</p>
                    <Badge variant={agCfg.variant}>{agCfg.label}</Badge>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">{patient.niss}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[var(--text-muted)]">{patient.mutuelle} ({patient.mutuelleCode})</span>
                    {patient.forfaitType && <Badge variant="blue">Forfait {patient.forfaitType}</Badge>}
                  </div>
                </div>
                {expandedId === patient.id ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
              </div>

              {expandedId === patient.id && (
                <div className="mt-3 pt-3 border-t border-[var(--border-default)] space-y-3">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-[var(--bg-secondary)] text-center">
                      <p className="text-xs font-bold">{fmt(patient.totalBilled)}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Facturé</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--bg-secondary)] text-center">
                      <p className="text-xs font-bold text-mc-green-500">{fmt(patient.totalPaid)}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Remboursé</p>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--bg-secondary)] text-center">
                      <p className="text-xs font-bold text-mc-amber-500">{fmt(patient.ticketModerateur)}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Ticket mod.</p>
                    </div>
                  </div>

                  {/* Agreement details */}
                  {patient.agreementEnd && (
                    <div className={`flex items-center gap-2 p-2 rounded-lg ${patient.agreementStatus === 'expired' ? 'bg-mc-red-500/10' : 'bg-mc-green-500/10'}`}>
                      <Shield className={`h-4 w-4 ${patient.agreementStatus === 'expired' ? 'text-mc-red-500' : 'text-mc-green-500'}`} />
                      <span className="text-xs">
                        Accord {patient.agreementStatus === 'expired' ? 'expiré le' : 'valide jusqu\'au'} <strong>{patient.agreementEnd}</strong>
                      </span>
                      {patient.agreementStatus === 'expired' && <Button variant="outline" size="sm" className="ml-auto">Renouveler</Button>}
                    </div>
                  )}

                  {/* Info row */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><span className="text-[var(--text-muted)]">Dernière visite:</span> <span className="font-medium">{patient.lastVisit}</span></div>
                    <div><span className="text-[var(--text-muted)]">Visites totales:</span> <span className="font-medium">{patient.visits}</span></div>
                  </div>

                  {/* Recent invoices */}
                  <div>
                    <p className="text-xs font-semibold mb-2">Dernières factures</p>
                    <div className="space-y-1.5">
                      {patient.invoices.map(inv => {
                        const invCfg = invoiceStatusConfig[inv.status];
                        return (
                          <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)]">
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3 text-[var(--text-muted)]" />
                              <span className="text-xs font-mono">{inv.id}</span>
                              <span className="text-[10px] text-[var(--text-muted)]">{inv.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold">{fmt(inv.amount)}</span>
                              <Badge variant={invCfg.variant}>{invCfg.label}</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Historique complet</Button>
                    <Button variant="ghost" size="sm">Exporter</Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </AnimatedPage>
  );
}
