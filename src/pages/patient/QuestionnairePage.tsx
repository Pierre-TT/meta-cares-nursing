import { useState } from 'react';
import { ClipboardList, CheckCircle2, ChevronRight } from 'lucide-react';
import { Card, Badge, Button, AnimatedPage, GradientHeader } from '@/design-system';

interface Questionnaire {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'expired';
  dueDate: string;
  completedDate?: string;
  questions?: Question[];
  score?: number;
}

interface Question {
  id: string;
  text: string;
  type: 'scale' | 'choice' | 'text';
  options?: string[];
  answer?: string | number;
}

const questionnaires: Questionnaire[] = [
  {
    id: '1', title: 'Évaluation de la douleur (EVA)', description: 'Échelle visuelle analogique de la douleur',
    status: 'pending', dueDate: '07/03/2025',
    questions: [
      { id: 'q1', text: 'Sur une échelle de 0 à 10, comment évaluez-vous votre douleur actuelle ?', type: 'scale' },
      { id: 'q2', text: 'Où se situe principalement la douleur ?', type: 'choice', options: ['Dos', 'Membres inférieurs', 'Membres supérieurs', 'Abdomen', 'Thorax', 'Tête'] },
      { id: 'q3', text: 'La douleur a-t-elle évolué depuis la dernière visite ?', type: 'choice', options: ['Améliorée', 'Stable', 'Aggravée'] },
      { id: 'q4', text: 'Commentaire libre', type: 'text' },
    ],
  },
  {
    id: '2', title: 'Satisfaction des soins', description: 'Questionnaire mensuel de satisfaction',
    status: 'pending', dueDate: '10/03/2025',
    questions: [
      { id: 'q1', text: 'Êtes-vous satisfait(e) de la ponctualité des visites ?', type: 'scale' },
      { id: 'q2', text: 'Comment évaluez-vous la qualité des soins reçus ?', type: 'scale' },
      { id: 'q3', text: 'L\'infirmière prend-elle le temps de vous écouter ?', type: 'choice', options: ['Toujours', 'Souvent', 'Parfois', 'Rarement'] },
      { id: 'q4', text: 'Suggestions d\'amélioration', type: 'text' },
    ],
  },
  {
    id: '3', title: 'Qualité de vie (EQ-5D)', description: 'Questionnaire européen de qualité de vie',
    status: 'completed', dueDate: '28/02/2025', completedDate: '27/02/2025', score: 72,
  },
  {
    id: '4', title: 'Évaluation de la douleur (EVA)', description: 'Échelle visuelle analogique — Février',
    status: 'completed', dueDate: '15/02/2025', completedDate: '14/02/2025', score: 4,
  },
];

export function QuestionnairePage() {
  const [active, setActive] = useState<string | null>(null);
  const [painValue, setPainValue] = useState(5);

  const activeQ = questionnaires.find(q => q.id === active);
  const pending = questionnaires.filter(q => q.status === 'pending');
  const completed = questionnaires.filter(q => q.status === 'completed');

  if (activeQ?.questions) {
    return (
      <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setActive(null)}>← Retour</Button>
        </div>
        <h1 className="text-xl font-bold">{activeQ.title}</h1>
        <p className="text-sm text-[var(--text-muted)]">{activeQ.description}</p>

        <div className="space-y-4">
          {activeQ.questions.map((q, i) => (
            <Card key={q.id}>
              <p className="font-medium mb-3">{i + 1}. {q.text}</p>
              {q.type === 'scale' && (
                <div className="space-y-2">
                  <input
                    type="range" min="0" max="10" value={painValue}
                    onChange={e => setPainValue(Number(e.target.value))}
                    className="w-full accent-mc-blue-500"
                  />
                  <div className="flex justify-between text-xs text-[var(--text-muted)]">
                    <span>0 — Aucune</span>
                    <span className="text-lg font-bold text-mc-blue-500">{painValue}</span>
                    <span>10 — Maximale</span>
                  </div>
                </div>
              )}
              {q.type === 'choice' && q.options && (
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map(opt => (
                    <button
                      key={opt}
                      className="px-3 py-2 rounded-lg border border-[var(--border-default)] text-sm hover:bg-mc-blue-500/10 hover:border-mc-blue-500 transition-colors text-left"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              {q.type === 'text' && (
                <textarea
                  rows={3}
                  placeholder="Votre réponse..."
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mc-blue-500/50"
                />
              )}
            </Card>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mb-1">
            <span>Progression</span>
            <span>~3 min restantes</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)]">
            <div className="h-full rounded-full bg-mc-blue-500 transition-all" style={{ width: '25%' }} />
          </div>
        </div>
        <Button variant="gradient" className="w-full">Envoyer mes réponses</Button>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<ClipboardList className="h-5 w-5" />}
        title="Questionnaires"
        subtitle="Aidez-nous à améliorer vos soins"
        badge={pending.length > 0 ? <Badge variant="amber">{pending.length} à compléter</Badge> : <Badge variant="green">Tout complet</Badge>}
      />

      {pending.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">À compléter</h2>
          {pending.map(q => (
            <Card key={q.id} className="cursor-pointer hover:ring-2 hover:ring-mc-blue-500/30 transition-all" onClick={() => setActive(q.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-mc-blue-500/10 flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-mc-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">{q.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">{q.description}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    <Badge variant="amber">À faire</Badge>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Avant le {q.dueDate}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
                </div>
              </div>
            </Card>
          ))}
        </>
      )}

      {completed.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mt-4">Complétés</h2>
          {completed.map(q => (
            <Card key={q.id} className="opacity-80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-mc-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-mc-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">{q.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">Complété le {q.completedDate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="green">Envoyé</Badge>
                  {q.score !== undefined && (
                    <p className="text-xs text-[var(--text-muted)] mt-1">Score: {q.score}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </>
      )}
    </AnimatedPage>
  );
}
