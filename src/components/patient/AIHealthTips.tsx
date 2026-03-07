import { useState } from 'react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/design-system';

const tips = [
  { id: 1, title: 'Tension élevée', text: 'Votre tension est légèrement élevée ces derniers jours. Réduisez le sel et marchez 15 min après le repas.' },
  { id: 2, title: 'Glycémie à jeun', text: 'Préférez un petit-déjeuner riche en fibres (pain complet, avoine) pour stabiliser votre glycémie matinale.' },
  { id: 3, title: 'Hydratation', text: 'Pensez à boire au moins 1.5L d\'eau par jour. La déshydratation peut aggraver la fatigue et les vertiges.' },
  { id: 4, title: 'Prévention chutes', text: 'Portez des chaussures fermées à la maison et utilisez les barres d\'appui dans la salle de bain.' },
];

export function AIHealthTips() {
  const [index, setIndex] = useState(0);
  const tip = tips[index];

  const prev = () => setIndex(i => (i - 1 + tips.length) % tips.length);
  const next = () => setIndex(i => (i + 1) % tips.length);

  return (
    <Card className="bg-gradient-to-r from-mc-blue-500/5 to-mc-green-500/5 border border-mc-blue-500/20">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-mc-blue-500 to-mc-green-500 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold mb-0.5">💡 {tip.title}</p>
          <p className="text-xs text-[var(--text-muted)]">{tip.text}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <button onClick={prev} className="p-1 rounded hover:bg-[var(--bg-tertiary)]">
          <ChevronLeft className="h-4 w-4 text-[var(--text-muted)]" />
        </button>
        <div className="flex gap-1">
          {tips.map((_, i) => (
            <div key={i} className={`h-1 w-4 rounded-full ${i === index ? 'bg-mc-blue-500' : 'bg-[var(--bg-tertiary)]'}`} />
          ))}
        </div>
        <button onClick={next} className="p-1 rounded hover:bg-[var(--bg-tertiary)]">
          <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
        </button>
      </div>
    </Card>
  );
}
