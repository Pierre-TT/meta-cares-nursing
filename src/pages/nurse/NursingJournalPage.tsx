import { useState } from 'react';
import { BookOpen, Clock, CheckCircle2, Download, Pen, ChevronDown, ChevronUp, User, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, AnimatedPage, GradientHeader, ContentTabs } from '@/design-system';

/* ── Journal Entry ── */
interface JournalEntry {
  id: string;
  date: string;
  time: string;
  patient: string;
  niss: string;
  acts: string[];
  observations: string;
  nomenclature: string;
  wValue: number;
  signed: boolean;
}

const journalEntries: JournalEntry[] = [
  { id: '1', date: '06/03/2025', time: '08:00-08:45', patient: 'Van Damme Pierre', niss: '38.11.22-456.78', acts: ['Toilette complète', 'Injection insuline', 'Pilulier'], observations: 'Patient stable. Glycémie 142 mg/dL. Bonne compliance médicamenteuse.', nomenclature: 'Art.8§1 Forfait B', wValue: 11.8, signed: true },
  { id: '2', date: '06/03/2025', time: '09:15-10:15', patient: 'Dubois Françoise', niss: '52.06.30-789.01', acts: ['Toilette', 'Soins de plaie sacrum', 'Pilulier'], observations: 'Plaie sacrum: amélioration 20%, bourgeonnement visible. Pansement Aquacel Ag+ renouvelé. Prochaine évaluation J+3.', nomenclature: 'Art.8§1 Forfait C', wValue: 14.4, signed: true },
  { id: '3', date: '06/03/2025', time: '10:30-11:20', patient: 'Janssens Maria', niss: '45.02.15-123.45', acts: ['Soins de plaie', 'Glycémie', 'Pilulier'], observations: 'Plaie jambe G: photo J+7 prise. Glycémie élevée 186 mg/dL — signalé au Dr. Dupont via eHealthBox.', nomenclature: 'Art.8§1 Forfait B', wValue: 11.8, signed: false },
  { id: '4', date: '05/03/2025', time: '08:15-09:00', patient: 'Van Damme Pierre', niss: '38.11.22-456.78', acts: ['Toilette complète', 'Injection insuline', 'Pilulier'], observations: 'RAS. Glycémie 128 mg/dL.', nomenclature: 'Art.8§1 Forfait B', wValue: 11.8, signed: true },
  { id: '5', date: '05/03/2025', time: '09:30-10:30', patient: 'Dubois Françoise', niss: '52.06.30-789.01', acts: ['Toilette', 'Soins de plaie sacrum', 'Pilulier'], observations: 'Plaie sacrum: détersion en cours. Douleur 4/10 EVA. Antalgique administré selon prescription.', nomenclature: 'Art.8§1 Forfait C', wValue: 14.4, signed: true },
];

const weekDates = ['06/03', '05/03', '04/03', '03/03', '02/03'];

export function NursingJournalPage() {
  const [selectedDate, setSelectedDate] = useState('06/03/2025');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const todayEntries = journalEntries.filter(e => e.date === selectedDate);
  const unsignedCount = todayEntries.filter(e => !e.signed).length;
  const totalW = todayEntries.reduce((s, e) => s + e.wValue, 0);

  const dailyTab = (
    <div className="space-y-3">
      {/* Date selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {weekDates.map(d => (
          <button
            key={d}
            onClick={() => setSelectedDate(d === '06/03' ? '06/03/2025' : '05/03/2025')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap chip-active ${
              selectedDate.startsWith(d)
                ? 'bg-[image:var(--gradient-brand)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Summary */}
      <Card glass>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-lg font-bold">{todayEntries.length}</p>
              <p className="text-[10px] text-[var(--text-muted)]">Entrées</p>
            </div>
            <div className="h-6 w-px bg-[var(--border-default)]" />
            <div className="text-center">
              <p className="text-lg font-bold">{totalW.toFixed(1)} W</p>
              <p className="text-[10px] text-[var(--text-muted)]">Total</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unsignedCount > 0 && (
              <Badge variant="amber">{unsignedCount} non signée(s)</Badge>
            )}
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-3.5 w-3.5" />
              PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Entries */}
      {todayEntries.map(entry => {
        const expanded = expandedEntry === entry.id;
        return (
          <Card key={entry.id} className={!entry.signed ? 'border-l-4 border-l-mc-amber-500' : ''}>
            <button
              className="w-full flex items-start justify-between"
              onClick={() => setExpandedEntry(expanded ? null : entry.id)}
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-mc-blue-500/10 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-mc-blue-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{entry.patient}</p>
                  <p className="text-xs text-[var(--text-muted)]">{entry.time} · {entry.nomenclature}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {entry.signed ? (
                  <Badge variant="green"><CheckCircle2 className="h-3 w-3 mr-1" />Signé</Badge>
                ) : (
                  <Badge variant="amber"><Pen className="h-3 w-3 mr-1" />À signer</Badge>
                )}
                {expanded ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
              </div>
            </button>

            {expanded && (
              <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <User className="h-3 w-3" /> NISS: {entry.niss}
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Actes prestés:</p>
                  <div className="flex flex-wrap gap-1">
                    {entry.acts.map(a => (
                      <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">{a}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Observations:</p>
                  <p className="text-sm">{entry.observations}</p>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Valeur: <strong>{entry.wValue} W</strong> · €{(entry.wValue * 7.25).toFixed(2)}</span>
                  {!entry.signed && (
                    <Button variant="gradient" size="sm" className="gap-1">
                      <Pen className="h-3 w-3" /> Signer
                    </Button>
                  )}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );

  const complianceTab = (
    <div className="space-y-3">
      <Card className="border-l-4 border-l-mc-blue-500">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-mc-blue-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Conformité légale</p>
            <p className="text-[var(--text-muted)]">
              Le journal de soins infirmiers est une obligation légale (AR du 18/06/1990). 
              Chaque entrée doit être signée numériquement et conservée pendant 30 ans.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader><CardTitle>Statistiques du mois</CardTitle></CardHeader>
        <div className="space-y-2">
          {[
            { label: 'Entrées ce mois', value: '48', ok: true },
            { label: 'Entrées signées', value: '45 / 48', ok: false },
            { label: 'Patients distincts', value: '12', ok: true },
            { label: 'Total W-values', value: '542.8 W', ok: true },
            { label: 'Export PDF mensuel', value: 'Disponible', ok: true },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] last:border-0">
              <span className="text-sm">{row.label}</span>
              <Badge variant={row.ok ? 'green' : 'amber'}>{row.value}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Button variant="gradient" className="w-full gap-2">
        <Download className="h-4 w-4" />
        Exporter journal complet (PDF)
      </Button>
    </div>
  );

  const tabs = [
    { id: 'daily', label: 'Journal quotidien', content: dailyTab },
    { id: 'compliance', label: 'Conformité', content: complianceTab },
  ];

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<BookOpen className="h-5 w-5" />}
        title="Journal de Soins"
        subtitle="Obligation légale — AR 18/06/1990"
        badge={<Badge variant="green">Conforme</Badge>}
      />
      <ContentTabs tabs={tabs} />
    </AnimatedPage>
  );
}
