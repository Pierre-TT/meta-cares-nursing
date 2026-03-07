import { useState } from 'react';
import { FileText, Download, Send, CheckCircle2, Clock, Eye, FileBarChart } from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, AnimatedPage } from '@/design-system';

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  fields: string[];
}

const templates: ReportTemplate[] = [
  { id: 'visit', title: 'Rapport de visite', description: 'Résumé complet d\'une visite avec actes, paramètres et notes', icon: <FileText className="h-5 w-5 text-mc-blue-500" />, fields: ['Patient', 'Date', 'Actes', 'Paramètres', 'Notes', 'Signature'] },
  { id: 'katz', title: 'Rapport Katz', description: 'Évaluation Katz avec scores AVQ détaillés et catégorie', icon: <FileBarChart className="h-5 w-5 text-mc-green-500" />, fields: ['Patient', 'Évaluateur', 'Scores AVQ', 'Catégorie', 'Historique'] },
  { id: 'belrai', title: 'Rapport BelRAI', description: 'BelRAI Screener complet avec CAPs activées et recommandations', icon: <FileBarChart className="h-5 w-5 text-mc-amber-500" />, fields: ['Patient', 'Sections interRAI', 'Scores', 'CAPs', 'Mapping Katz'] },
  { id: 'wound', title: 'Rapport plaie', description: 'Suivi de plaie avec photos, mesures, évolution et protocole', icon: <FileText className="h-5 w-5 text-mc-red-500" />, fields: ['Patient', 'Localisation', 'Photos', 'Mesures', 'Évolution', 'Protocole'] },
  { id: 'monthly', title: 'Rapport mensuel', description: 'Synthèse mensuelle: visites, actes, revenus, paramètres agrégés', icon: <FileBarChart className="h-5 w-5 text-mc-blue-500" />, fields: ['Période', 'Visites', 'Actes', 'Revenus', 'Patients', 'KPIs'] },
];

const recentReports = [
  { id: '1', type: 'visit', patient: 'Janssens Maria', date: '06/03/2025', status: 'sent' as const },
  { id: '2', type: 'katz', patient: 'Van Damme Pierre', date: '05/03/2025', status: 'generated' as const },
  { id: '3', type: 'wound', patient: 'Janssens Maria', date: '04/03/2025', status: 'sent' as const },
  { id: '4', type: 'belrai', patient: 'Dubois Françoise', date: '03/03/2025', status: 'generated' as const },
];

export function ReportGeneratorPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string | null>(null);

  const handleGenerate = (id: string) => {
    setGenerating(id);
    setTimeout(() => {
      setGenerating(null);
      setGenerated(id);
      setTimeout(() => setGenerated(null), 3000);
    }, 1500);
  };

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">Rapports PDF</h1>

      {/* Templates */}
      <div className="space-y-3">
        {templates.map(tpl => (
          <Card key={tpl.id} className="hover:ring-2 hover:ring-mc-blue-500/20 transition-all">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                {tpl.icon}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{tpl.title}</p>
                <p className="text-xs text-[var(--text-muted)]">{tpl.description}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {tpl.fields.map(f => (
                    <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">{f}</span>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="gradient" size="sm" className="gap-1"
                    onClick={() => handleGenerate(tpl.id)}
                    disabled={generating === tpl.id}
                  >
                    {generating === tpl.id ? <Clock className="h-3.5 w-3.5 animate-spin" /> : generated === tpl.id ? <CheckCircle2 className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                    {generating === tpl.id ? 'Génération…' : generated === tpl.id ? 'Prêt !' : 'Générer'}
                  </Button>
                  {generated === tpl.id && (
                    <>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Download className="h-3.5 w-3.5" /> PDF
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Send className="h-3.5 w-3.5" /> eHealthBox
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent reports */}
      <Card>
        <CardHeader><CardTitle>Rapports récents</CardTitle></CardHeader>
        <div className="space-y-2">
          {recentReports.map(r => (
            <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-[var(--border-subtle)] last:border-0 text-sm">
              <div>
                <p className="font-medium">{templates.find(t => t.id === r.type)?.title}</p>
                <p className="text-xs text-[var(--text-muted)]">{r.patient} · {r.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.status === 'sent' ? 'green' : 'blue'}>
                  {r.status === 'sent' ? 'Envoyé' : 'Généré'}
                </Badge>
                <Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AnimatedPage>
  );
}
