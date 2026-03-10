import { useState } from 'react';
import { ShieldCheck, Search, Eye, Edit, Trash2, Download, Send, Lock, User, FileText } from 'lucide-react';
import { Card, Badge, Input, AnimatedPage, GradientHeader, Tabs } from '@/design-system';
import { maskNiss } from '@/lib/niss';

type AuditAction = 'view' | 'edit' | 'delete' | 'export' | 'send' | 'login' | 'create';
interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: AuditAction;
  resource: string;
  details: string;
  ip: string;
  sensitiveData: boolean;
}

const auditLog: AuditEntry[] = [
  { id: 'A001', timestamp: '2026-03-06 09:15:23', user: 'Marie Billing', role: 'Tarificatrice', action: 'send', resource: 'eFact LOT-2026-0089', details: 'Envoi lot eFact 24 prestations à MC (100)', ip: '192.168.1.45', sensitiveData: false },
  { id: 'A002', timestamp: '2026-03-06 09:12:05', user: 'Marie Billing', role: 'Tarificatrice', action: 'view', resource: 'Patient Devos M-C', details: `Consultation dossier patient NISS ${maskNiss('52.01.15-123.45')}`, ip: '192.168.1.45', sensitiveData: true },
  { id: 'A003', timestamp: '2026-03-06 08:45:11', user: 'Admin System', role: 'Administrateur', action: 'export', resource: 'Rapport mensuel Fév 2026', details: 'Export CSV rapports financiers février 2026', ip: '192.168.1.10', sensitiveData: false },
  { id: 'A004', timestamp: '2026-03-05 17:30:42', user: 'Marie Billing', role: 'Tarificatrice', action: 'edit', resource: 'Prestation #P-4521', details: 'Correction code nomenclature 425132→425110', ip: '192.168.1.45', sensitiveData: false },
  { id: 'A005', timestamp: '2026-03-05 16:20:18', user: 'Sophie Dupont', role: 'Infirmière', action: 'view', resource: 'Accord AG-001', details: 'Consultation accord patient Devos', ip: '192.168.1.102', sensitiveData: true },
  { id: 'A006', timestamp: '2026-03-05 14:55:33', user: 'Marie Billing', role: 'Tarificatrice', action: 'create', resource: 'eFact LOT-2026-0090', details: 'Création nouveau lot eFact — 18 prestations', ip: '192.168.1.45', sensitiveData: false },
  { id: 'A007', timestamp: '2026-03-05 11:10:07', user: 'Admin System', role: 'Administrateur', action: 'delete', resource: 'Brouillon LOT-TMP-042', details: 'Suppression lot brouillon obsolète', ip: '192.168.1.10', sensitiveData: false },
  { id: 'A008', timestamp: '2026-03-05 08:00:01', user: 'Marie Billing', role: 'Tarificatrice', action: 'login', resource: 'Session', details: 'Connexion bureau tarification', ip: '192.168.1.45', sensitiveData: false },
  { id: 'A009', timestamp: '2026-03-04 16:45:22', user: 'Marc Janssens', role: 'Infirmier', action: 'view', resource: 'Patient Lemaire J-P', details: `Consultation dossier patient NISS ${maskNiss('45.07.22-456.78')}`, ip: '192.168.1.88', sensitiveData: true },
  { id: 'A010', timestamp: '2026-03-04 14:30:55', user: 'Marie Billing', role: 'Tarificatrice', action: 'send', resource: 'Relance Solidaris', details: 'Envoi relance paiement LOT-2026-0084', ip: '192.168.1.45', sensitiveData: false },
];

const actionConfig: Record<AuditAction, { label: string; icon: React.ReactNode; variant: 'green' | 'blue' | 'red' | 'amber' }> = {
  view: { label: 'Consultation', icon: <Eye className="h-3.5 w-3.5" />, variant: 'blue' },
  edit: { label: 'Modification', icon: <Edit className="h-3.5 w-3.5" />, variant: 'amber' },
  delete: { label: 'Suppression', icon: <Trash2 className="h-3.5 w-3.5" />, variant: 'red' },
  export: { label: 'Export', icon: <Download className="h-3.5 w-3.5" />, variant: 'green' },
  send: { label: 'Envoi', icon: <Send className="h-3.5 w-3.5" />, variant: 'green' },
  login: { label: 'Connexion', icon: <Lock className="h-3.5 w-3.5" />, variant: 'blue' },
  create: { label: 'Création', icon: <FileText className="h-3.5 w-3.5" />, variant: 'green' },
};

const tabs = [
  { id: 'all', label: 'Tout' },
  { id: 'sensitive', label: 'Données sensibles' },
  { id: 'modifications', label: 'Modifications' },
  { id: 'exports', label: 'Exports' },
];

export function BillingAuditPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = auditLog.filter(entry => {
    if (activeTab === 'sensitive' && !entry.sensitiveData) return false;
    if (activeTab === 'modifications' && entry.action !== 'edit' && entry.action !== 'delete' && entry.action !== 'create') return false;
    if (activeTab === 'exports' && entry.action !== 'export') return false;
    if (search) {
      const q = search.toLowerCase();
      return entry.user.toLowerCase().includes(q) || entry.resource.toLowerCase().includes(q) || entry.details.toLowerCase().includes(q);
    }
    return true;
  });

  const sensitiveCount = auditLog.filter(e => e.sensitiveData).length;
  const todayCount = auditLog.filter(e => e.timestamp.startsWith('2026-03-06')).length;

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<ShieldCheck className="h-5 w-5" />}
        title="Journal d'audit"
        subtitle="Traçabilité & conformité RGPD"
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{auditLog.length}</p>
            <p className="text-[10px] text-white/60">Actions</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-amber-300">{sensitiveCount}</p>
            <p className="text-[10px] text-white/60">Accès sensibles</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-green-300">{todayCount}</p>
            <p className="text-[10px] text-white/60">Aujourd'hui</p>
          </div>
        </div>
      </GradientHeader>

      {/* RGPD compliance banner */}
      <Card className="border-l-4 border-l-mc-blue-500">
        <div className="flex items-start gap-3">
          <Lock className="h-4 w-4 text-mc-blue-500 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Conformité RGPD</p>
            <p className="text-xs text-[var(--text-muted)]">
              Toutes les actions sur données personnelles (NISS, dossiers patients) sont tracées. Conservation: 10 ans (obligation légale Art. 458 Code pénal belge).
            </p>
          </div>
        </div>
      </Card>

      <Input icon={<Search className="h-4 w-4" />} placeholder="Rechercher utilisateur ou action…" value={search} onChange={e => setSearch(e.target.value)} />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Timeline */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card className="text-center py-8">
            <ShieldCheck className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm">Aucune entrée trouvée</p>
          </Card>
        ) : filtered.map(entry => {
          const cfg = actionConfig[entry.action];
          return (
            <Card key={entry.id} className={entry.sensitiveData ? 'border-l-4 border-l-mc-amber-500' : ''}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${entry.sensitiveData ? 'bg-mc-amber-500/10 text-mc-amber-500' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'}`}>
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    {entry.sensitiveData && <Badge variant="amber">RGPD</Badge>}
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">{entry.timestamp}</span>
                  </div>
                  <p className="text-sm font-medium mt-0.5">{entry.resource}</p>
                  <p className="text-xs text-[var(--text-muted)]">{entry.details}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-[var(--text-muted)]" />
                      <span className="text-[10px]">{entry.user}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">({entry.role})</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">{entry.ip}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="p-3 rounded-xl bg-mc-blue-500/5 border border-mc-blue-500/20">
        <p className="text-[10px] text-center text-[var(--text-muted)]">
          Journal d'audit conforme au RGPD (Règlement 2016/679) et à la loi belge du 30 juillet 2018 relative à la protection des personnes physiques à l'égard des traitements de données.
        </p>
      </div>
    </AnimatedPage>
  );
}
