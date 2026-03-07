import { useState } from 'react';
import { Download, TrendingUp, TrendingDown, BarChart3, FileSpreadsheet, FileText as FilePdf } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, AnimatedPage, GradientHeader, Tabs } from '@/design-system';

const monthlyData = [
  { month: 'Mars 2026', invoices: 187, accepted: 182, rejected: 5, revenue: 12450, rate: 97.3, trend: 3.2 },
  { month: 'Février 2026', invoices: 210, accepted: 206, rejected: 4, revenue: 14200, rate: 98.1, trend: 8.4 },
  { month: 'Janvier 2026', invoices: 195, accepted: 189, rejected: 6, revenue: 13100, rate: 96.9, trend: -2.1 },
  { month: 'Décembre 2025', invoices: 178, accepted: 173, rejected: 5, revenue: 11890, rate: 97.2, trend: 1.5 },
  { month: 'Novembre 2025', invoices: 165, accepted: 161, rejected: 4, revenue: 10250, rate: 97.6, trend: -0.8 },
  { month: 'Octobre 2025', invoices: 192, accepted: 186, rejected: 6, revenue: 12800, rate: 96.9, trend: 5.2 },
];

const topCodes = [
  { code: '425110', label: 'Toilette complète', count: 89, revenue: 3325 },
  { code: '425434', label: 'Préparation médicaments', count: 76, revenue: 1980 },
  { code: '425596', label: 'Pansement simple', count: 52, revenue: 1163 },
  { code: '425375', label: 'Injection SC/IM', count: 41, revenue: 917 },
  { code: '425132', label: 'Toilette partielle', count: 38, revenue: 708 },
];

const mutuelleBreakdown = [
  { name: 'Mutualité Chrétienne (100)', revenue: 4820, invoices: 72, rate: 98.6, color: '#47B6FF' },
  { name: 'Solidaris (300)', revenue: 3650, invoices: 55, rate: 96.4, color: '#4ABD33' },
  { name: 'Partenamut (500)', revenue: 2340, invoices: 35, rate: 97.1, color: '#F59E0B' },
  { name: 'Mutualité Neutre (200)', revenue: 890, invoices: 14, rate: 100, color: '#8B5CF6' },
  { name: 'Mutualités Libres (600)', revenue: 750, invoices: 11, rate: 95.5, color: '#EC4899' },
];

const dateRanges = [
  { id: '1m', label: '1 mois' },
  { id: '3m', label: '3 mois' },
  { id: '6m', label: '6 mois' },
  { id: '12m', label: '1 an' },
];

const tabs = [
  { id: 'overview', label: 'Vue générale' },
  { id: 'mutuelles', label: 'Par mutuelle' },
  { id: 'codes', label: 'Codes INAMI' },
];

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('3m');
  const maxRevenue = Math.max(...monthlyData.map(m => m.revenue));
  const mutuelleTotal = mutuelleBreakdown.reduce((s, m) => s + m.revenue, 0);

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<BarChart3 className="h-5 w-5" />}
        title="Rapports"
        subtitle="Analyse facturation"
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">€{monthlyData[0].revenue.toLocaleString()}</p>
            <p className="text-[10px] text-white/60">CA ce mois</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{monthlyData[0].rate}%</p>
            <p className="text-[10px] text-white/60">Acceptation</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{monthlyData[0].rejected}</p>
            <p className="text-[10px] text-white/60">Rejets</p>
          </div>
        </div>
      </GradientHeader>

      {/* Date range picker + Export */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {dateRanges.map(r => (
            <button key={r.id} onClick={() => setDateRange(r.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${dateRange === r.id ? 'bg-[image:var(--gradient-brand)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
            >{r.label}</button>
          ))}
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm"><Download className="h-3 w-3" /> CSV</Button>
          <Button variant="outline" size="sm"><FileSpreadsheet className="h-3 w-3" /> Excel</Button>
          <Button variant="outline" size="sm"><FilePdf className="h-3 w-3" /> PDF</Button>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <>
          {/* Revenue chart (bar visualization) */}
          <Card>
            <CardHeader><CardTitle>Évolution du chiffre d'affaires</CardTitle></CardHeader>
            <div className="flex items-end gap-2 h-40 mt-2">
              {monthlyData.slice(0, 6).reverse().map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold">€{(m.revenue / 1000).toFixed(1)}k</span>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-[#47B6FF] to-[#4ABD33] transition-all" style={{ height: `${(m.revenue / maxRevenue) * 100}%` }} />
                  <span className="text-[9px] text-[var(--text-muted)]">{m.month.split(' ')[0].slice(0, 3)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Monthly breakdown */}
          <Card>
            <CardHeader><CardTitle>Détail mensuel</CardTitle></CardHeader>
            <div className="space-y-3">
              {monthlyData.map(m => (
                <div key={m.month} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                  <div>
                    <p className="text-sm font-semibold">{m.month}</p>
                    <p className="text-xs text-[var(--text-muted)]">{m.invoices} factures • {m.accepted} acceptées • {m.rejected} rejetées</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-sm font-bold">€{m.revenue.toLocaleString()}</p>
                      <Badge variant={m.rate >= 98 ? 'green' : m.rate >= 96 ? 'amber' : 'red'}>{m.rate}%</Badge>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {m.trend > 0 ? <TrendingUp className="h-3 w-3 text-mc-green-500" /> : <TrendingDown className="h-3 w-3 text-mc-red-500" />}
                      <span className={`text-[10px] font-medium ${m.trend > 0 ? 'text-mc-green-500' : 'text-mc-red-500'}`}>
                        {m.trend > 0 ? '+' : ''}{m.trend}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {activeTab === 'mutuelles' && (
        <>
          {/* Visual pie-like breakdown */}
          <Card>
            <CardHeader><CardTitle>Répartition par mutuelle</CardTitle></CardHeader>
            <div className="h-4 rounded-full overflow-hidden flex mt-2">
              {mutuelleBreakdown.map(m => (
                <div key={m.name} style={{ width: `${(m.revenue / mutuelleTotal) * 100}%`, backgroundColor: m.color }} className="h-full" />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              {mutuelleBreakdown.map(m => (
                <div key={m.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-[10px] text-[var(--text-muted)]">{m.name.split(' (')[0]}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-2">
            {mutuelleBreakdown.map(m => (
              <Card key={m.name}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-10 rounded-full" style={{ backgroundColor: m.color }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{m.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{m.invoices} factures</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">€{m.revenue.toLocaleString()}</p>
                    <Badge variant={m.rate >= 98 ? 'green' : m.rate >= 96 ? 'amber' : 'red'}>{m.rate}%</Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === 'codes' && (
        <Card>
          <CardHeader><CardTitle>Top codes INAMI</CardTitle></CardHeader>
          <div className="space-y-2">
            {topCodes.map((c, i) => (
              <div key={c.code} className="flex items-center gap-3 py-1.5">
                <span className={`text-xs font-bold w-5 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-[var(--text-muted)]'}`}>{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-[var(--text-muted)] font-mono">Art.8 {c.code} • {c.count}×</p>
                  <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden mt-1">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#47B6FF] to-[#4ABD33]" style={{ width: `${(c.revenue / topCodes[0].revenue) * 100}%` }} />
                  </div>
                </div>
                <p className="text-sm font-bold">€{c.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AnimatedPage>
  );
}
