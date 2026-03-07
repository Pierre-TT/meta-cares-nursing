import { PenLine, CheckCircle, ChevronRight } from 'lucide-react';
import { Card, Badge, Button, AnimatedPage, GradientHeader } from '@/design-system';

const mockCorrections = [
  { id: 'c1', original: '425110 — Toilette complète', corrected: '425132 — Toilette partielle', patient: 'Martin Claudine', nurse: 'Sophie Dupuis', date: '04/03/2026', status: 'pending' as const, reason: 'Downgrade suite cumul interdit' },
  { id: 'c2', original: '425375 — Injection SC/IM', corrected: '425375 — Injection SC/IM + prescription', patient: 'Peeters Henri', nurse: 'Laura Van Damme', date: '03/03/2026', status: 'pending' as const, reason: 'Ajout prescription manquante' },
  { id: 'c3', original: '425611 — Pansement complexe', corrected: '425596 — Pansement simple', patient: 'Dubois Marie', nurse: 'Marie Laurent', date: '28/02/2026', status: 'sent' as const, reason: 'Accord non obtenu, reclassification' },
];

export function CorrectionsPage() {
  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-5xl mx-auto space-y-4">
      <GradientHeader
        icon={<PenLine className="h-5 w-5" />}
        title="Corrections"
        subtitle={`${mockCorrections.filter(c => c.status === 'pending').length} en attente d'envoi`}
        badge={<Badge variant="amber">MyCareNet</Badge>}
      />

      <div className="space-y-3">
        {mockCorrections.map(corr => (
          <Card key={corr.id} hover>
            <div className="flex items-start gap-3">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${corr.status === 'pending' ? 'bg-mc-amber-50 dark:bg-amber-900/30' : 'bg-mc-green-50 dark:bg-mc-green-900/30'}`}>
                {corr.status === 'pending' ? <PenLine className="h-5 w-5 text-mc-amber-500" /> : <CheckCircle className="h-5 w-5 text-mc-green-500" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold">{corr.patient}</p>
                  <Badge variant={corr.status === 'pending' ? 'amber' : 'green'}>
                    {corr.status === 'pending' ? 'À envoyer' : 'Envoyé'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span className="line-through text-mc-red-400">{corr.original}</span>
                  <ChevronRight className="h-3 w-3 text-[var(--text-muted)]" />
                  <span className="text-mc-green-500 font-medium">{corr.corrected}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{corr.reason}</p>
                <p className="text-xs text-[var(--text-muted)]">{corr.nurse} • {corr.date}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button variant="gradient" size="lg" className="w-full">
        Envoyer les corrections via MyCareNet
      </Button>
    </AnimatedPage>
  );
}
