import { useState } from 'react';
import { FileCheck, Send, Download, Clock, Printer, Euro, Calendar } from 'lucide-react';
import { Card, Badge, Button, AnimatedPage, GradientHeader, ContentTabs } from '@/design-system';

interface ASDRecord {
  id: string;
  patient: string;
  niss: string;
  period: string;
  acts: { code: string; label: string; qty: number; wValue: number }[];
  totalAmount: number;
  status: 'draft' | 'generated' | 'delivered';
  generatedDate?: string;
}

const asdRecords: ASDRecord[] = [
  {
    id: '1', patient: 'Janssens Maria', niss: '45.02.15-123.45', period: '01/03/2025 — 06/03/2025',
    acts: [
      { code: '425110', label: 'Toilette complète', qty: 5, wValue: 5.143 },
      { code: '425596', label: 'Pansement simple', qty: 5, wValue: 3.086 },
      { code: '425434', label: 'Préparation médic.', qty: 5, wValue: 3.6 },
    ],
    totalAmount: 428.37, status: 'draft',
  },
  {
    id: '2', patient: 'Van Damme Pierre', niss: '38.11.22-456.78', period: '01/03/2025 — 06/03/2025',
    acts: [
      { code: '425375', label: 'Injection SC', qty: 6, wValue: 3.086 },
      { code: '425670', label: 'Surveillance param.', qty: 6, wValue: 1.543 },
    ],
    totalAmount: 201.25, status: 'generated', generatedDate: '06/03/2025',
  },
  {
    id: '3', patient: 'Dubois Françoise', niss: '52.06.30-789.01', period: '24/02/2025 — 28/02/2025',
    acts: [
      { code: '425110', label: 'Toilette complète', qty: 5, wValue: 5.143 },
      { code: '425611', label: 'Pansement complexe', qty: 5, wValue: 5.143 },
    ],
    totalAmount: 373.19, status: 'delivered', generatedDate: '01/03/2025',
  },
];

const statusConfig = {
  draft: { label: 'Brouillon', variant: 'default' as const },
  generated: { label: 'Généré', variant: 'blue' as const },
  delivered: { label: 'Remis', variant: 'green' as const },
};

export function ASDPage() {
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerate = (id: string) => {
    setGenerating(id);
    setTimeout(() => setGenerating(null), 1500);
  };

  const generateTab = (
    <div className="space-y-3">
      <Card glass>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{asdRecords.filter(r => r.status === 'draft').length} ASD en brouillon</p>
            <p className="text-xs text-[var(--text-muted)]">
              Total: €{asdRecords.filter(r => r.status === 'draft').reduce((s, r) => s + r.totalAmount, 0).toFixed(2)}
            </p>
          </div>
          <Button variant="gradient" size="sm" className="gap-1">
            <Printer className="h-3.5 w-3.5" /> Tout générer
          </Button>
        </div>
      </Card>

      {asdRecords.map(asd => {
        const cfg = statusConfig[asd.status];
        return (
          <Card key={asd.id}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-sm">{asd.patient}</p>
                <p className="text-xs text-[var(--text-muted)]">NISS: {asd.niss}</p>
                <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mt-0.5">
                  <Calendar className="h-3 w-3" /> {asd.period}
                </div>
              </div>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
            </div>

            {/* Acts breakdown */}
            <div className="space-y-1 mb-2">
              {asd.acts.map(act => (
                <div key={act.code} className="flex items-center justify-between text-xs py-1 border-b border-[var(--border-subtle)] last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[var(--text-muted)]">{act.code}</span>
                    <span>{act.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>×{act.qty}</span>
                    <span className="font-medium">€{(act.qty * act.wValue * 7.25).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm">
                <Euro className="h-3.5 w-3.5 text-mc-green-500" />
                <span className="font-bold text-mc-green-500">€{asd.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                {asd.status === 'draft' && (
                  <Button variant="gradient" size="sm" className="gap-1" onClick={() => handleGenerate(asd.id)} disabled={generating === asd.id}>
                    {generating === asd.id ? <Clock className="h-3.5 w-3.5 animate-spin" /> : <FileCheck className="h-3.5 w-3.5" />}
                    {generating === asd.id ? 'Génération…' : 'Générer ASD'}
                  </Button>
                )}
                {asd.status === 'generated' && (
                  <>
                    <Button variant="outline" size="sm" className="gap-1"><Download className="h-3.5 w-3.5" /> PDF</Button>
                    <Button variant="gradient" size="sm" className="gap-1"><Send className="h-3.5 w-3.5" /> Remettre</Button>
                  </>
                )}
                {asd.status === 'delivered' && (
                  <Button variant="outline" size="sm" className="gap-1"><Download className="h-3.5 w-3.5" /> PDF</Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  const tabs = [
    { id: 'generate', label: `ASD (${asdRecords.length})`, content: generateTab },
  ];

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<FileCheck className="h-5 w-5" />}
        title="Attestations de Soins"
        subtitle="ASD — Nomenclature Art. 8"
        badge={<Badge variant="blue">INAMI</Badge>}
      />
      <ContentTabs tabs={tabs} />
    </AnimatedPage>
  );
}
