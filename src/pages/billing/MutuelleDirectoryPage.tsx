import { useState } from 'react';
import { Building2, Search, Phone, Mail, Globe, CheckCircle, MapPin, Clock } from 'lucide-react';
import { Card, Badge, Input, AnimatedPage, GradientHeader, Tabs } from '@/design-system';

interface Mutuelle {
  id: string;
  code: string;
  name: string;
  shortName: string;
  category: 'christian' | 'socialist' | 'liberal' | 'neutral' | 'auxiliary' | 'free';
  region: 'national' | 'wallonie' | 'flandre' | 'bruxelles';
  phone: string;
  email: string;
  website: string;
  address: string;
  efactStatus: 'active' | 'partial' | 'unavailable';
  mycarenetConnected: boolean;
  avgPaymentDays: number;
  patientCount: number;
}

const mutuelles: Mutuelle[] = [
  {
    id: '1', code: '100-199', name: 'Alliance nationale des Mutualités chrétiennes', shortName: 'Mutualité Chrétienne',
    category: 'christian', region: 'national', phone: '02 246 41 11', email: 'info@mc.be', website: 'www.mc.be',
    address: 'Chaussée de Haecht 579, 1031 Bruxelles', efactStatus: 'active', mycarenetConnected: true, avgPaymentDays: 8, patientCount: 42,
  },
  {
    id: '2', code: '200-299', name: 'Union nationale des Mutualités neutres', shortName: 'Mutualité Neutre',
    category: 'neutral', region: 'national', phone: '02 538 83 00', email: 'info@munalux.be', website: 'www.mutualite-neutre.be',
    address: 'Chaussée de Charleroi 145, 1060 Bruxelles', efactStatus: 'active', mycarenetConnected: true, avgPaymentDays: 10, patientCount: 8,
  },
  {
    id: '3', code: '300-399', name: 'Union nationale des Mutualités socialistes', shortName: 'Solidaris',
    category: 'socialist', region: 'national', phone: '02 515 02 00', email: 'info@solidaris.be', website: 'www.solidaris.be',
    address: 'Rue Saint-Jean 32, 1000 Bruxelles', efactStatus: 'active', mycarenetConnected: true, avgPaymentDays: 7, patientCount: 35,
  },
  {
    id: '4', code: '400-499', name: 'Union nationale des Mutualités libérales', shortName: 'Mutualités Libérales',
    category: 'liberal', region: 'national', phone: '02 542 86 00', email: 'info@mut400.be', website: 'www.mutualite-liberale.be',
    address: 'Rue de Livourne 25, 1050 Bruxelles', efactStatus: 'active', mycarenetConnected: true, avgPaymentDays: 9, patientCount: 5,
  },
  {
    id: '5', code: '500-599', name: 'Union nationale des Mutualités libres', shortName: 'Partenamut',
    category: 'free', region: 'national', phone: '02 444 41 11', email: 'info@partenamut.be', website: 'www.partenamut.be',
    address: 'Boulevard Louis Mettewie 74/76, 1080 Bruxelles', efactStatus: 'active', mycarenetConnected: true, avgPaymentDays: 8, patientCount: 22,
  },
  {
    id: '6', code: '600-699', name: 'Caisse auxiliaire d\'assurance maladie-invalidité', shortName: 'CAAMI',
    category: 'auxiliary', region: 'national', phone: '02 229 35 00', email: 'info@caami.be', website: 'www.caami-hziv.fgov.be',
    address: 'Rue du Trône 30, 1000 Bruxelles', efactStatus: 'partial', mycarenetConnected: true, avgPaymentDays: 14, patientCount: 3,
  },
];

const categoryColors: Record<string, string> = {
  christian: 'bg-orange-100 text-orange-700',
  socialist: 'bg-red-100 text-red-700',
  liberal: 'bg-blue-100 text-blue-700',
  neutral: 'bg-gray-100 text-gray-700',
  free: 'bg-purple-100 text-purple-700',
  auxiliary: 'bg-teal-100 text-teal-700',
};

const tabs = [
  { id: 'all', label: 'Toutes' },
  { id: 'connected', label: 'MyCareNet' },
  { id: 'top', label: 'Plus de patients' },
];

export function MutuelleDirectoryPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  let filtered = mutuelles.filter(m => {
    if (search) {
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.shortName.toLowerCase().includes(q) || m.code.includes(search);
    }
    return true;
  });

  if (activeTab === 'connected') filtered = filtered.filter(m => m.mycarenetConnected);
  if (activeTab === 'top') filtered = [...filtered].sort((a, b) => b.patientCount - a.patientCount);

  const totalPatients = mutuelles.reduce((s, m) => s + m.patientCount, 0);

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<Building2 className="h-5 w-5" />}
        title="Annuaire mutuelles"
        subtitle="Organismes assureurs belges"
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{mutuelles.length}</p>
            <p className="text-[10px] text-white/60">Mutuelles</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-green-300">{mutuelles.filter(m => m.mycarenetConnected).length}</p>
            <p className="text-[10px] text-white/60">MyCareNet</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{totalPatients}</p>
            <p className="text-[10px] text-white/60">Patients</p>
          </div>
        </div>
      </GradientHeader>

      <Input icon={<Search className="h-4 w-4" />} placeholder="Rechercher mutuelle ou code…" value={search} onChange={e => setSearch(e.target.value)} />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="space-y-3">
        {filtered.map(m => (
          <Card key={m.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#47B6FF] to-[#4ABD33] flex items-center justify-center text-white font-bold text-xs">
                {m.code.split('-')[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{m.shortName}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${categoryColors[m.category]}`}>
                    {m.code}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] truncate">{m.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {m.mycarenetConnected && <Badge variant="green">MyCareNet ✓</Badge>}
                  <Badge variant={m.efactStatus === 'active' ? 'green' : m.efactStatus === 'partial' ? 'amber' : 'red'}>
                    eFact {m.efactStatus === 'active' ? 'OK' : m.efactStatus === 'partial' ? 'Partiel' : '✗'}
                  </Badge>
                  <span className="text-[10px] text-[var(--text-muted)]">{m.patientCount} patients</span>
                </div>
              </div>
            </div>

            {expandedId === m.id && (
              <div className="mt-3 pt-3 border-t border-[var(--border-default)] space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin className="h-3 w-3 text-[var(--text-muted)]" />
                    <span>{m.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Phone className="h-3 w-3 text-[var(--text-muted)]" />
                    <span>{m.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Mail className="h-3 w-3 text-[var(--text-muted)]" />
                    <span className="text-mc-blue-500">{m.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Globe className="h-3 w-3 text-[var(--text-muted)]" />
                    <span className="text-mc-blue-500">{m.website}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded-lg bg-[var(--bg-secondary)]">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-[var(--text-muted)]" />
                      <span className="text-[10px] text-[var(--text-muted)]">Délai paiement moyen</span>
                    </div>
                    <p className={`text-sm font-bold ${m.avgPaymentDays > 10 ? 'text-mc-amber-500' : 'text-mc-green-500'}`}>{m.avgPaymentDays} jours</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--bg-secondary)]">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-[var(--text-muted)]" />
                      <span className="text-[10px] text-[var(--text-muted)]">Patients actifs</span>
                    </div>
                    <p className="text-sm font-bold">{m.patientCount}</p>
                  </div>
                </div>

                {/* Patient distribution bar */}
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] mb-1">Part du portefeuille</p>
                  <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#47B6FF] to-[#4ABD33]"
                      style={{ width: `${(m.patientCount / totalPatients) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] text-right mt-0.5">{((m.patientCount / totalPatients) * 100).toFixed(1)}%</p>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </AnimatedPage>
  );
}
