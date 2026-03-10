import { useState } from 'react';
import { CheckCircle, ChevronRight, PenLine } from 'lucide-react';
import { AnimatedPage, Badge, Button, Card, GradientHeader } from '@/design-system';

interface CorrectionRecord {
  id: string;
  original: string;
  corrected: string;
  patient: string;
  nurse: string;
  date: string;
  status: 'pending' | 'sent';
  reason: string;
}

const seedCorrections: CorrectionRecord[] = [
  { id: 'c1', original: '425110 - Toilette complete', corrected: '425132 - Toilette partielle', patient: 'Martin Claudine', nurse: 'Sophie Dupuis', date: '04/03/2026', status: 'pending', reason: 'Downgrade suite cumul interdit' },
  { id: 'c2', original: '425375 - Injection SC/IM', corrected: '425375 - Injection SC/IM + prescription', patient: 'Peeters Henri', nurse: 'Laura Van Damme', date: '03/03/2026', status: 'pending', reason: 'Ajout prescription manquante' },
  { id: 'c3', original: '425611 - Pansement complexe', corrected: '425596 - Pansement simple', patient: 'Dubois Marie', nurse: 'Marie Laurent', date: '28/02/2026', status: 'sent', reason: 'Accord non obtenu, reclassification' },
];

export function CorrectionsPage() {
  const [corrections, setCorrections] = useState(seedCorrections);
  const [feedback, setFeedback] = useState<string | null>(null);

  const pendingCount = corrections.filter((correction) => correction.status === 'pending').length;

  function handleSendCorrections() {
    if (pendingCount === 0) {
      setFeedback('Toutes les corrections sont deja transmises.');
      return;
    }

    setCorrections((previous) =>
      previous.map((correction) => (correction.status === 'pending' ? { ...correction, status: 'sent' as const } : correction))
    );
    setFeedback(`${pendingCount} correction(s) envoyee(s) via MyCareNet.`);
  }

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<PenLine className="h-5 w-5" />}
        title="Corrections"
        subtitle={`${pendingCount} en attente d'envoi`}
        badge={<Badge variant="amber">MyCareNet</Badge>}
      />

      {feedback && (
        <div role="status" className="flex items-center gap-2 p-3 rounded-xl bg-mc-blue-500/10 border border-mc-blue-500/20">
          <CheckCircle className="h-4 w-4 text-mc-blue-500" />
          <span className="text-sm font-medium">{feedback}</span>
        </div>
      )}

      <div className="space-y-3">
        {corrections.map((correction) => (
          <Card key={correction.id} hover>
            <div className="flex items-start gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${correction.status === 'pending' ? 'bg-mc-amber-50 dark:bg-amber-900/30' : 'bg-mc-green-50 dark:bg-mc-green-900/30'}`}>
                {correction.status === 'pending' ? <PenLine className="h-5 w-5 text-mc-amber-500" /> : <CheckCircle className="h-5 w-5 text-mc-green-500" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold">{correction.patient}</p>
                  <Badge variant={correction.status === 'pending' ? 'amber' : 'green'}>
                    {correction.status === 'pending' ? 'A envoyer' : 'Envoye'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span className="line-through text-mc-red-400">{correction.original}</span>
                  <ChevronRight className="h-3 w-3 text-[var(--text-muted)]" />
                  <span className="text-mc-green-500 font-medium">{correction.corrected}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{correction.reason}</p>
                <p className="text-xs text-[var(--text-muted)]">{correction.nurse} - {correction.date}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button variant="gradient" size="lg" className="w-full" onClick={handleSendCorrections}>
        Envoyer les corrections via MyCareNet
      </Button>
    </AnimatedPage>
  );
}
