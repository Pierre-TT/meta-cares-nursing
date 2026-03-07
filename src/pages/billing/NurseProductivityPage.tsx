import { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Badge, Avatar, Input, AnimatedPage, GradientHeader, StatRing, Tabs } from '@/design-system';

interface NurseStat {
  id: string;
  name: string;
  initials: string;
  inami: string;
  visits: number;
  revenue: number;
  rejectRate: number;
  avgPerVisit: number;
  forfaitMix: number; // % forfait vs actes
  trend: 'up' | 'down' | 'stable';
  trendPct: number;
  topCodes: { code: string; count: number }[];
}

const nurses: NurseStat[] = [
  { id: '1', name: 'Sophie Dupont', initials: 'SD', inami: '4-12345-00-001', visits: 342, revenue: 12450.80, rejectRate: 1.2, avgPerVisit: 36.41, forfaitMix: 72, trend: 'up', trendPct: 8.3, topCodes: [{ code: '425050', count: 180 }, { code: '425375', count: 95 }, { code: '425596', count: 67 }] },
  { id: '2', name: 'Marc Janssens', initials: 'MJ', inami: '4-12345-00-002', visits: 298, revenue: 10890.50, rejectRate: 2.8, avgPerVisit: 36.55, forfaitMix: 65, trend: 'up', trendPct: 3.1, topCodes: [{ code: '425072', count: 145 }, { code: '425434', count: 88 }, { code: '425611', count: 65 }] },
  { id: '3', name: 'Elena Verstraeten', initials: 'EV', inami: '4-12345-00-003', visits: 315, revenue: 11200.30, rejectRate: 0.9, avgPerVisit: 35.56, forfaitMix: 78, trend: 'up', trendPct: 12.5, topCodes: [{ code: '425094', count: 200 }, { code: '425375', count: 70 }, { code: '425596', count: 45 }] },
  { id: '4', name: 'Thomas Peeters', initials: 'TP', inami: '4-12345-00-004', visits: 210, revenue: 7680.20, rejectRate: 4.5, avgPerVisit: 36.57, forfaitMix: 55, trend: 'down', trendPct: 2.1, topCodes: [{ code: '425050', count: 85 }, { code: '425132', count: 75 }, { code: '425434', count: 50 }] },
  { id: '5', name: 'Nathalie Wouters', initials: 'NW', inami: '4-12345-00-005', visits: 278, revenue: 9540.60, rejectRate: 1.8, avgPerVisit: 34.32, forfaitMix: 68, trend: 'stable', trendPct: 0.4, topCodes: [{ code: '425072', count: 120 }, { code: '425375', count: 90 }, { code: '425611', count: 68 }] },
  { id: '6', name: 'Pierre Lambert', initials: 'PL', inami: '4-12345-00-006', visits: 189, revenue: 6320.40, rejectRate: 6.2, avgPerVisit: 33.44, forfaitMix: 48, trend: 'down', trendPct: 5.7, topCodes: [{ code: '425110', count: 70 }, { code: '425596', count: 65 }, { code: '425434', count: 54 }] },
];

const tabs = [
  { id: 'revenue', label: 'Revenu' },
  { id: 'visits', label: 'Visites' },
  { id: 'efficiency', label: 'Efficacité' },
];

function fmt(n: number) { return n.toLocaleString('fr-BE', { style: 'currency', currency: 'EUR' }); }

export function NurseProductivityPage() {
  const [activeTab, setActiveTab] = useState('revenue');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = [...nurses]
    .filter(n => !search || n.name.toLowerCase().includes(search.toLowerCase()) || n.inami.includes(search))
    .sort((a, b) => {
      if (activeTab === 'revenue') return b.revenue - a.revenue;
      if (activeTab === 'visits') return b.visits - a.visits;
      return a.rejectRate - b.rejectRate;
    });

  const totalRevenue = nurses.reduce((s, n) => s + n.revenue, 0);
  const totalVisits = nurses.reduce((s, n) => s + n.visits, 0);
  const avgRejectRate = nurses.reduce((s, n) => s + n.rejectRate, 0) / nurses.length;

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<BarChart3 className="h-5 w-5" />}
        title="Productivité infirmiers"
        subtitle="Analyse de performance — Mars 2026"
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{nurses.length}</p>
            <p className="text-[10px] text-white/60">Infirmiers</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-mc-green-300">{fmt(totalRevenue)}</p>
            <p className="text-[10px] text-white/60">CA total</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{totalVisits}</p>
            <p className="text-[10px] text-white/60">Visites</p>
          </div>
        </div>
      </GradientHeader>

      {/* KPI rings */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="flex flex-col items-center py-3">
          <StatRing value={totalVisits} max={2000} color="blue" label="Visites" />
        </Card>
        <Card className="flex flex-col items-center py-3">
          <StatRing value={Math.round(totalRevenue / totalVisits * 10) / 10} max={50} color="green" label="€/visite" />
        </Card>
        <Card className="flex flex-col items-center py-3">
          <StatRing value={Math.round(avgRejectRate * 10) / 10} max={10} color={avgRejectRate > 3 ? 'red' : 'green'} label="% rejet" />
        </Card>
      </div>

      <Input icon={<Search className="h-4 w-4" />} placeholder="Rechercher infirmier…" value={search} onChange={e => setSearch(e.target.value)} />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Ranking */}
      <div className="space-y-3">
        {sorted.map((nurse, idx) => (
          <Card key={nurse.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === nurse.id ? null : nurse.id)}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar name={nurse.name} size="md" />
                {idx < 3 && (
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-amber-600'}`}>
                    {idx + 1}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{nurse.name}</p>
                  {nurse.trend === 'up' && <TrendingUp className="h-3 w-3 text-mc-green-500" />}
                  {nurse.trend === 'down' && <TrendingDown className="h-3 w-3 text-mc-red-500" />}
                  <span className={`text-[10px] font-medium ${nurse.trend === 'up' ? 'text-mc-green-500' : nurse.trend === 'down' ? 'text-mc-red-500' : 'text-[var(--text-muted)]'}`}>
                    {nurse.trend !== 'stable' ? `${nurse.trend === 'up' ? '+' : '-'}${nurse.trendPct}%` : '—'}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] font-mono">{nurse.inami}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-bold">{fmt(nurse.revenue)}</span>
                  <span className="text-xs text-[var(--text-muted)]">{nurse.visits} visites</span>
                  <Badge variant={nurse.rejectRate > 3 ? 'red' : nurse.rejectRate > 2 ? 'amber' : 'green'}>{nurse.rejectRate}% rejet</Badge>
                </div>
              </div>
              {expandedId === nurse.id ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
            </div>

            {expandedId === nurse.id && (
              <div className="mt-3 pt-3 border-t border-[var(--border-default)] space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded-lg bg-[var(--bg-secondary)]">
                    <p className="text-[10px] text-[var(--text-muted)]">Moyenne/visite</p>
                    <p className="text-sm font-bold">{fmt(nurse.avgPerVisit)}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--bg-secondary)]">
                    <p className="text-[10px] text-[var(--text-muted)]">Mix forfaitaire</p>
                    <p className="text-sm font-bold">{nurse.forfaitMix}%</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold mb-2">Codes les plus utilisés</p>
                  <div className="space-y-1.5">
                    {nurse.topCodes.map(tc => (
                      <div key={tc.code} className="flex items-center gap-2">
                        <span className="text-xs font-mono w-16">{tc.code}</span>
                        <div className="flex-1 h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#47B6FF] to-[#4ABD33]" style={{ width: `${(tc.count / nurse.visits) * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] w-8 text-right">{tc.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {nurse.rejectRate > 3 && (
                  <div className="p-2 rounded-lg bg-mc-amber-500/10 text-xs text-mc-amber-600">
                    ⚠ Taux de rejet supérieur à la moyenne — vérifier les encodages
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </AnimatedPage>
  );
}
