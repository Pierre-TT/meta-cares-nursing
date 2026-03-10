import { useState } from 'react';
import { Shield, Search, Eye, Edit3, Trash2, LogIn, FileText, AlertTriangle, HardDrive, RefreshCw } from 'lucide-react';
import { Badge, Card, Input, AnimatedPage, GradientHeader, Tabs } from '@/design-system';
import { useAdminEHealthCompliance } from '@/hooks/useEHealthCompliance';
import { useAdminPlatformData } from '@/hooks/usePlatformData';

const actionIcons = { VIEW: Eye, EDIT: Edit3, EXPORT: FileText, LOGIN: LogIn, DELETE: Trash2, BACKUP: HardDrive, SYNC: RefreshCw };
const actionColors = { VIEW: 'blue', EDIT: 'amber', EXPORT: 'green', LOGIN: 'outline', DELETE: 'red', BACKUP: 'green', SYNC: 'blue' } as const;

export function AuditPage() {
  const { data } = useAdminPlatformData();
  const { data: compliance } = useAdminEHealthCompliance();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const audit = compliance.audit.auditLog.length > 0 ? compliance.audit : data.audit;
  const auditLog = audit.auditLog;
  const tabs = [
    { id: 'all', label: 'Tout', count: auditLog.length },
    { id: 'high', label: 'Critique', count: auditLog.filter((l) => l.severity === 'high').length },
    { id: 'pii', label: 'PII', count: auditLog.filter((l) => l.pii).length },
    { id: 'system', label: 'Système', count: auditLog.filter((l) => l.system).length },
  ];
  const filtered = auditLog.filter((l) => {
    if (activeTab === 'high' && l.severity !== 'high') return false;
    if (activeTab === 'pii' && !l.pii) return false;
    if (activeTab === 'system' && !l.system) return false;
    if (search && !l.user.toLowerCase().includes(search.toLowerCase()) && !l.resource.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Shield className="h-5 w-5" />}
        title="Journal d'audit"
        subtitle="Détection d’anomalies et traçabilité RGPD"
        badge={<Badge variant="green">RGPD Conforme</Badge>}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{auditLog.length}</p>
            <p className="text-[10px] text-white/60">Entrées</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{auditLog.filter((l) => l.pii).length}</p>
            <p className="text-[10px] text-white/60">Accès PII</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{auditLog.filter((l) => l.severity === 'high').length}</p>
            <p className="text-[10px] text-white/60">Anomalies</p>
          </div>
        </div>
      </GradientHeader>

      <Card className="border-l-4 border-l-mc-red-500">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-mc-red-500 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Suspicious activity detector</p>
            <p className="text-xs text-[var(--text-muted)]">{audit.suspiciousActivityNote}</p>
          </div>
        </div>
      </Card>

      <Input placeholder="Rechercher utilisateur ou ressource..." icon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="space-y-1.5">
        {filtered.map((log) => {
          const Icon = actionIcons[log.action as keyof typeof actionIcons] || Eye;
          const color = actionColors[log.action as keyof typeof actionColors] || 'outline';
          return (
            <Card key={log.id} padding="sm" className={log.severity === 'high' ? 'border-l-4 border-l-mc-red-500' : ''}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-[var(--text-muted)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{log.user}</span>
                    <Badge variant={color}>{log.action}</Badge>
                    <Badge variant={log.severity === 'high' ? 'red' : log.severity === 'medium' ? 'amber' : 'green'}>{log.severity}</Badge>
                    {log.pii && <Badge variant="blue">PII</Badge>}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate">{log.resource}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-[var(--text-muted)]">{log.time}</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">{log.ip}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </AnimatedPage>
  );
}
