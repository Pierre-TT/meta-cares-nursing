import { useState } from 'react';
import { Shield, CheckCircle2, XCircle, Clock, RefreshCw, Search, AlertTriangle, User } from 'lucide-react';
import { Card, Badge, Button, AnimatedPage } from '@/design-system';

interface ConsentRecord {
  id: string;
  patient: string;
  niss: string;
  consentType: 'therapeutic_relation' | 'vitalink' | 'sumehr' | 'medication_schema';
  status: 'active' | 'expired' | 'absent' | 'revoked';
  grantedDate?: string;
  expiryDate?: string;
  lastChecked: string;
}

const consents: ConsentRecord[] = [
  { id: '1', patient: 'Janssens Maria', niss: '45.02.15-123.45', consentType: 'therapeutic_relation', status: 'active', grantedDate: '01/01/2025', expiryDate: '31/12/2025', lastChecked: '06/03/2025 08:30' },
  { id: '2', patient: 'Janssens Maria', niss: '45.02.15-123.45', consentType: 'vitalink', status: 'active', grantedDate: '01/01/2025', expiryDate: '31/12/2025', lastChecked: '06/03/2025 08:30' },
  { id: '3', patient: 'Janssens Maria', niss: '45.02.15-123.45', consentType: 'sumehr', status: 'active', grantedDate: '01/01/2025', expiryDate: '31/12/2025', lastChecked: '06/03/2025 08:30' },
  { id: '4', patient: 'Van Damme Pierre', niss: '38.11.22-456.78', consentType: 'therapeutic_relation', status: 'active', grantedDate: '15/02/2025', expiryDate: '15/02/2026', lastChecked: '06/03/2025 09:00' },
  { id: '5', patient: 'Van Damme Pierre', niss: '38.11.22-456.78', consentType: 'vitalink', status: 'absent', lastChecked: '06/03/2025 09:00' },
  { id: '6', patient: 'Dubois Françoise', niss: '52.06.30-789.01', consentType: 'therapeutic_relation', status: 'expired', grantedDate: '01/06/2024', expiryDate: '01/12/2024', lastChecked: '06/03/2025 09:15' },
  { id: '7', patient: 'Dubois Françoise', niss: '52.06.30-789.01', consentType: 'vitalink', status: 'revoked', grantedDate: '01/06/2024', lastChecked: '06/03/2025 09:15' },
  { id: '8', patient: 'Peeters Jan', niss: '60.03.15-234.56', consentType: 'therapeutic_relation', status: 'active', grantedDate: '01/02/2025', expiryDate: '01/02/2026', lastChecked: '05/03/2025 14:00' },
];

const consentTypeLabels: Record<ConsentRecord['consentType'], string> = {
  therapeutic_relation: 'Relation thérapeutique',
  vitalink: 'Vitalink',
  sumehr: 'SumEHR',
  medication_schema: 'Schéma médicamenteux',
};

const statusStyles: Record<ConsentRecord['status'], { label: string; variant: 'green' | 'amber' | 'red' | 'default'; icon: typeof CheckCircle2 }> = {
  active: { label: 'Actif', variant: 'green', icon: CheckCircle2 },
  expired: { label: 'Expiré', variant: 'amber', icon: Clock },
  absent: { label: 'Absent', variant: 'red', icon: XCircle },
  revoked: { label: 'Révoqué', variant: 'red', icon: XCircle },
};

export function ConsentPage() {
  const [search, setSearch] = useState('');

  // Group by patient
  const patients = [...new Set(consents.map(c => c.patient))];
  const filtered = search
    ? patients.filter(p => p.toLowerCase().includes(search.toLowerCase()))
    : patients;

  const activeCount = consents.filter(c => c.status === 'active').length;
  const issueCount = consents.filter(c => c.status !== 'active').length;

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Consentements eHealth</h1>
        <Badge variant="green">
          <Shield className="h-3.5 w-3.5 mr-1" />
          eHealth
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card glass className="text-center">
          <CheckCircle2 className="h-5 w-5 text-mc-green-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{activeCount}</p>
          <p className="text-xs text-[var(--text-muted)]">Consentements actifs</p>
        </Card>
        <Card glass className="text-center">
          <AlertTriangle className="h-5 w-5 text-mc-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{issueCount}</p>
          <p className="text-xs text-[var(--text-muted)]">À régulariser</p>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Rechercher un patient..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue-500/50"
        />
      </div>

      <div className="space-y-4">
        {filtered.map(patient => {
          const patientConsents = consents.filter(c => c.patient === patient);
          const hasIssue = patientConsents.some(c => c.status !== 'active');
          return (
            <Card key={patient} className={hasIssue ? 'border-l-4 border-l-mc-amber-500' : ''}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-mc-blue-500/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-mc-blue-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{patient}</p>
                  <p className="text-xs text-[var(--text-muted)]">NISS: {patientConsents[0].niss}</p>
                </div>
              </div>

              <div className="space-y-2">
                {patientConsents.map(c => {
                  const style = statusStyles[c.status];
                  const Icon = style.icon;
                  return (
                    <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] last:border-0">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${c.status === 'active' ? 'text-mc-green-500' : 'text-mc-amber-500'}`} />
                        <span className="text-sm">{consentTypeLabels[c.consentType]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={style.variant}>{style.label}</Badge>
                        {c.expiryDate && c.status === 'active' && (
                          <span className="text-xs text-[var(--text-muted)]">→ {c.expiryDate}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasIssue && (
                <Button variant="outline" size="sm" className="w-full mt-3 gap-1 text-xs">
                  <RefreshCw className="h-3.5 w-3.5" /> Demander renouvellement
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </AnimatedPage>
  );
}
