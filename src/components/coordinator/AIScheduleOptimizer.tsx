import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Route, CheckCircle, ChevronDown, ChevronUp, ArrowRightLeft } from 'lucide-react';
import { Card, Badge, Button } from '@/design-system';

interface Suggestion {
  id: string;
  type: 'route' | 'swap' | 'rebalance';
  title: string;
  detail: string;
  savingKm?: number;
  savingMin?: number;
  confidence: number;
}

const mockSuggestions: Suggestion[] = [
  { id: 'ai1', type: 'route', title: 'Optimiser tournée Marie', detail: 'Réordonner 3 visites à Ixelles pour éviter retour', savingKm: 8.2, savingMin: 22, confidence: 94 },
  { id: 'ai2', type: 'swap', title: 'Échanger visite #412', detail: 'Transférer Mme Dubois de Sophie → Thomas (plus proche)', savingKm: 3.1, savingMin: 12, confidence: 87 },
  { id: 'ai3', type: 'rebalance', title: 'Rééquilibrer charge', detail: 'Laura a 3 visites de moins que la moyenne — proposer 2 transferts', savingMin: 0, confidence: 79 },
];

const typeIcons = { route: Route, swap: ArrowRightLeft, rebalance: Sparkles };
const typeColors = { route: 'text-mc-blue-500', swap: 'text-purple-500', rebalance: 'text-mc-green-500' };

export function AIScheduleOptimizer() {
  const [expanded, setExpanded] = useState(true);
  const [applied, setApplied] = useState<Set<string>>(new Set());

  const totalKm = mockSuggestions.reduce((s, sg) => s + (sg.savingKm ?? 0), 0);
  const totalMin = mockSuggestions.reduce((s, sg) => s + (sg.savingMin ?? 0), 0);

  const handleApply = (id: string) => {
    setApplied(prev => new Set(prev).add(id));
  };

  return (
    <Card className="overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center gap-3 text-left">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-mc-blue-500 to-mc-green-500 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">AI Schedule Optimizer</p>
          <p className="text-[10px] text-[var(--text-muted)]">{mockSuggestions.length} suggestions • −{totalKm.toFixed(1)}km • −{totalMin}min</p>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">
              {mockSuggestions.map(sg => {
                const Icon = typeIcons[sg.type];
                const isApplied = applied.has(sg.id);
                return (
                  <motion.div key={sg.id} layout className="flex items-start gap-3 p-2 rounded-lg bg-[var(--bg-tertiary)]">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${typeColors[sg.type]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold truncate">{sg.title}</p>
                        <Badge variant={sg.confidence >= 90 ? 'green' : sg.confidence >= 80 ? 'amber' : 'outline'}>
                          {sg.confidence}%
                        </Badge>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)]">{sg.detail}</p>
                      {(sg.savingKm || sg.savingMin) && (
                        <div className="flex items-center gap-2 mt-1">
                          {sg.savingKm ? <span className="text-[10px] text-mc-green-500 font-medium">−{sg.savingKm}km</span> : null}
                          {sg.savingMin ? <span className="text-[10px] text-mc-blue-500 font-medium">−{sg.savingMin}min</span> : null}
                        </div>
                      )}
                    </div>
                    <Button
                      variant={isApplied ? 'ghost' : 'primary'}
                      size="sm"
                      onClick={() => handleApply(sg.id)}
                      disabled={isApplied}
                    >
                      {isApplied ? <CheckCircle className="h-3.5 w-3.5 text-mc-green-500" /> : 'Appliquer'}
                    </Button>
                  </motion.div>
                );
              })}
            </div>

            <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => mockSuggestions.forEach(s => handleApply(s.id))}>
              <Sparkles className="h-3.5 w-3.5" /> Appliquer toutes les suggestions
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
