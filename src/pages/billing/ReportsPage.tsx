import { useMemo, useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText as FilePdf, TrendingDown, TrendingUp } from 'lucide-react';
import { AnimatedPage, Badge, Button, Card, CardHeader, CardTitle, GradientHeader, Tabs } from '@/design-system';
import { buildSimplePdf, downloadTextFile } from '@/lib/download';

const monthlyData = [
  { month: 'Mars 2026', invoices: 187, accepted: 182, rejected: 5, revenue: 12450, rate: 97.3, trend: 3.2 },
  { month: 'Fevrier 2026', invoices: 210, accepted: 206, rejected: 4, revenue: 14200, rate: 98.1, trend: 8.4 },
  { month: 'Janvier 2026', invoices: 195, accepted: 189, rejected: 6, revenue: 13100, rate: 96.9, trend: -2.1 },
  { month: 'Decembre 2025', invoices: 178, accepted: 173, rejected: 5, revenue: 11890, rate: 97.2, trend: 1.5 },
  { month: 'Novembre 2025', invoices: 165, accepted: 161, rejected: 4, revenue: 10250, rate: 97.6, trend: -0.8 },
  { month: 'Octobre 2025', invoices: 192, accepted: 186, rejected: 6, revenue: 12800, rate: 96.9, trend: 5.2 },
];

const topCodes = [
  { code: '425110', label: 'Toilette complete', count: 89, revenue: 3325 },
  { code: '425434', label: 'Preparation medicaments', count: 76, revenue: 1980 },
  { code: '425596', label: 'Pansement simple', count: 52, revenue: 1163 },
  { code: '425375', label: 'Injection SC/IM', count: 41, revenue: 917 },
  { code: '425132', label: 'Toilette partielle', count: 38, revenue: 708 },
];

const mutuelleBreakdown = [
  { name: 'Mutualite Chretienne (100)', revenue: 4820, invoices: 72, rate: 98.6, color: '#47B6FF' },
  { name: 'Solidaris (300)', revenue: 3650, invoices: 55, rate: 96.4, color: '#4ABD33' },
  { name: 'Partenamut (500)', revenue: 2340, invoices: 35, rate: 97.1, color: '#F59E0B' },
  { name: 'Mutualite Neutre (200)', revenue: 890, invoices: 14, rate: 100, color: '#8B5CF6' },
  { name: 'Mutualites Libres (600)', revenue: 750, invoices: 11, rate: 95.5, color: '#EC4899' },
];

const dateRanges = [
  { id: '1m', label: '1 mois' },
  { id: '3m', label: '3 mois' },
  { id: '6m', label: '6 mois' },
  { id: '12m', label: '1 an' },
];

const tabs = [
  { id: 'overview', label: 'Vue generale' },
  { id: 'mutuelles', label: 'Par mutuelle' },
  { id: 'codes', label: 'Codes INAMI' },
];

function buildCsv(rows: string[][]) {
  return rows.map((columns) => columns.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n');
}

function buildExcelTable(rows: string[][]) {
  return rows.map((columns) => columns.join('\t')).join('\n');
}

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('3m');
  const [feedback, setFeedback] = useState<string | null>(null);

  const maxRevenue = Math.max(...monthlyData.map((month) => month.revenue));
  const mutuelleTotal = mutuelleBreakdown.reduce((sum, mutuelle) => sum + mutuelle.revenue, 0);

  const reportRows = useMemo(() => {
    if (activeTab === 'mutuelles') {
      return [
        ['mutuelle', 'factures', 'revenu', 'acceptation'],
        ...mutuelleBreakdown.map((mutuelle) => [
          mutuelle.name,
          String(mutuelle.invoices),
          String(mutuelle.revenue),
          `${mutuelle.rate}%`,
        ]),
      ];
    }

    if (activeTab === 'codes') {
      return [
        ['code', 'label', 'count', 'revenue'],
        ...topCodes.map((code) => [code.code, code.label, String(code.count), String(code.revenue)]),
      ];
    }

    return [
      ['month', 'invoices', 'accepted', 'rejected', 'revenue', 'acceptance_rate'],
      ...monthlyData.map((month) => [
        month.month,
        String(month.invoices),
        String(month.accepted),
        String(month.rejected),
        String(month.revenue),
        `${month.rate}%`,
      ]),
    ];
  }, [activeTab]);

  function handleExport(kind: 'csv' | 'excel' | 'pdf') {
    const filenameBase = `billing-report-${activeTab}-${dateRange}`;

    if (kind === 'csv') {
      const success = downloadTextFile(`${filenameBase}.csv`, buildCsv(reportRows), 'text/csv;charset=utf-8');
      setFeedback(success ? 'Export CSV prepare.' : 'Export indisponible dans cet environnement.');
      return;
    }

    if (kind === 'excel') {
      const success = downloadTextFile(`${filenameBase}.xls`, buildExcelTable(reportRows), 'application/vnd.ms-excel');
      setFeedback(success ? 'Export Excel prepare.' : 'Export indisponible dans cet environnement.');
      return;
    }

    const summaryLines = reportRows.slice(1, 10).map((row) => row.join(' | '));
    const success = downloadTextFile(
      `${filenameBase}.pdf`,
      buildSimplePdf('Billing report', [`Vue: ${activeTab}`, `Periode: ${dateRange}`, ...summaryLines]),
      'application/pdf'
    );
    setFeedback(success ? 'Export PDF prepare.' : 'Export indisponible dans cet environnement.');
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader icon={<BarChart3 className="h-5 w-5" />} title="Rapports" subtitle="Analyse facturation">
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">EUR {monthlyData[0].revenue.toLocaleString()}</p>
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

      {feedback && (
        <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-mc-blue-500/10 border border-mc-blue-500/20">
          <Download className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {dateRanges.map((range) => (
            <button
              key={range.id}
              type="button"
              onClick={() => setDateRange(range.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${dateRange === range.id ? 'bg-[image:var(--gradient-brand)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}
            >
              {range.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}><Download className="h-3 w-3" /> CSV</Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')}><FileSpreadsheet className="h-3 w-3" /> Excel</Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}><FilePdf className="h-3 w-3" /> PDF</Button>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' && (
        <>
          <Card>
            <CardHeader><CardTitle>Evolution du chiffre d'affaires</CardTitle></CardHeader>
            <div className="flex items-end gap-2 h-40 mt-2">
              {monthlyData.slice(0, 6).reverse().map((month) => (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold">EUR {(month.revenue / 1000).toFixed(1)}k</span>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-[#47B6FF] to-[#4ABD33] transition-all" style={{ height: `${(month.revenue / maxRevenue) * 100}%` }} />
                  <span className="text-[9px] text-[var(--text-muted)]">{month.month.split(' ')[0].slice(0, 3)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Detail mensuel</CardTitle></CardHeader>
            <div className="space-y-3">
              {monthlyData.map((month) => (
                <div key={month.month} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                  <div>
                    <p className="text-sm font-semibold">{month.month}</p>
                    <p className="text-xs text-[var(--text-muted)]">{month.invoices} factures - {month.accepted} acceptees - {month.rejected} rejetees</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-sm font-bold">EUR {month.revenue.toLocaleString()}</p>
                      <Badge variant={month.rate >= 98 ? 'green' : month.rate >= 96 ? 'amber' : 'red'}>{month.rate}%</Badge>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {month.trend > 0 ? <TrendingUp className="h-3 w-3 text-mc-green-500" /> : <TrendingDown className="h-3 w-3 text-mc-red-500" />}
                      <span className={`text-[10px] font-medium ${month.trend > 0 ? 'text-mc-green-500' : 'text-mc-red-500'}`}>
                        {month.trend > 0 ? '+' : ''}{month.trend}%
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
          <Card>
            <CardHeader><CardTitle>Repartition par mutuelle</CardTitle></CardHeader>
            <div className="h-4 rounded-full overflow-hidden flex mt-2">
              {mutuelleBreakdown.map((mutuelle) => (
                <div key={mutuelle.name} style={{ width: `${(mutuelle.revenue / mutuelleTotal) * 100}%`, backgroundColor: mutuelle.color }} className="h-full" />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              {mutuelleBreakdown.map((mutuelle) => (
                <div key={mutuelle.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mutuelle.color }} />
                  <span className="text-[10px] text-[var(--text-muted)]">{mutuelle.name.split(' (')[0]}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-2">
            {mutuelleBreakdown.map((mutuelle) => (
              <Card key={mutuelle.name}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-10 rounded-full" style={{ backgroundColor: mutuelle.color }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{mutuelle.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{mutuelle.invoices} factures</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">EUR {mutuelle.revenue.toLocaleString()}</p>
                    <Badge variant={mutuelle.rate >= 98 ? 'green' : mutuelle.rate >= 96 ? 'amber' : 'red'}>{mutuelle.rate}%</Badge>
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
            {topCodes.map((code, index) => (
              <div key={code.code} className="flex items-center gap-3 py-1.5">
                <span className={`text-xs font-bold w-5 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-[var(--text-muted)]'}`}>{index + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{code.label}</p>
                  <p className="text-xs text-[var(--text-muted)] font-mono">Art.8 {code.code} - {code.count}x</p>
                  <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden mt-1">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#47B6FF] to-[#4ABD33]" style={{ width: `${(code.revenue / topCodes[0].revenue) * 100}%` }} />
                  </div>
                </div>
                <p className="text-sm font-bold">EUR {code.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </AnimatedPage>
  );
}
