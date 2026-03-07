import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Calculator,
  Brain,
} from 'lucide-react';
import { Button, Card, Badge, AnimatedPage } from '@/design-system';
import { useNursePatient } from '@/hooks/useNursePatients';

interface KatzCriterion {
  id: string;
  label: string;
  description: string;
  scores: { value: number; label: string }[];
}

const katzCriteria: KatzCriterion[] = [
  {
    id: 'washing', label: 'Se laver', description: 'Capacité à faire sa toilette',
    scores: [{ value: 1, label: 'Autonome' }, { value: 2, label: 'Aide partielle' }, { value: 3, label: 'Aide complète' }, { value: 4, label: 'Totalement dépendant' }],
  },
  {
    id: 'dressing', label: 'S\'habiller', description: 'Capacité à s\'habiller et se déshabiller',
    scores: [{ value: 1, label: 'Autonome' }, { value: 2, label: 'Aide partielle' }, { value: 3, label: 'Aide complète' }, { value: 4, label: 'Totalement dépendant' }],
  },
  {
    id: 'transfer', label: 'Transfert & déplacement', description: 'Se déplacer dans le logement',
    scores: [{ value: 1, label: 'Autonome' }, { value: 2, label: 'Aide partielle' }, { value: 3, label: 'Aide complète' }, { value: 4, label: 'Totalement dépendant' }],
  },
  {
    id: 'toilet', label: 'Aller aux toilettes', description: 'Utilisation des toilettes',
    scores: [{ value: 1, label: 'Autonome' }, { value: 2, label: 'Aide partielle' }, { value: 3, label: 'Aide complète' }, { value: 4, label: 'Totalement dépendant' }],
  },
  {
    id: 'continence', label: 'Continence', description: 'Contrôle urinaire et fécal',
    scores: [{ value: 1, label: 'Continent' }, { value: 2, label: 'Incontinence occasionnelle' }, { value: 3, label: 'Incontinent urinaire / fécal' }, { value: 4, label: 'Doublement incontinent' }],
  },
  {
    id: 'eating', label: 'Manger', description: 'Capacité à manger seul',
    scores: [{ value: 1, label: 'Autonome' }, { value: 2, label: 'Aide partielle' }, { value: 3, label: 'Aide complète' }, { value: 4, label: 'Totalement dépendant' }],
  },
  // 2 additional criteria for Belgian Katz
  {
    id: 'orientation_time', label: 'Orientation temps', description: 'Conscience temporelle',
    scores: [{ value: 1, label: 'Orienté' }, { value: 2, label: 'Problèmes occasionnels' }, { value: 3, label: 'Désorienté' }],
  },
  {
    id: 'orientation_space', label: 'Orientation espace', description: 'Conscience spatiale',
    scores: [{ value: 1, label: 'Orienté' }, { value: 2, label: 'Problèmes occasionnels' }, { value: 3, label: 'Désorienté' }],
  },
];

function determineKatzCategory(totalScore: number, disoriented: boolean): { category: string; forfait: string } {
  if (disoriented && totalScore >= 24) return { category: 'Cd', forfait: 'Forfait C + supplément démence' };
  if (totalScore >= 24) return { category: 'C', forfait: 'Forfait C' };
  if (totalScore >= 18) return { category: 'B', forfait: 'Forfait B' };
  if (totalScore >= 12) return { category: 'A', forfait: 'Forfait A' };
  return { category: 'O', forfait: 'Pas de forfait (actes)' };
}

export function KatzEvaluationPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { data: patient, isLoading, error, refetch } = useNursePatient(patientId);
  const [scores, setScores] = useState<Record<string, number>>({});

  const totalScore = useMemo(() =>
    Object.values(scores).reduce((s, v) => s + v, 0),
    [scores]
  );

  const disoriented = (scores['orientation_time'] ?? 0) >= 2 || (scores['orientation_space'] ?? 0) >= 2;
  const result = determineKatzCategory(totalScore, disoriented);
  const allFilled = katzCriteria.every(c => scores[c.id] !== undefined);
  const currentKatzLabel = patient?.katzCategory
    ? `Katz ${patient.katzCategory}${patient.katzScore ? ` (score ${patient.katzScore})` : ''}`
    : 'Aucune catégorie Katz enregistrée';

  if (error) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-3">
        <h2 className="text-lg font-bold">Évaluation Katz indisponible</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Le dossier patient lié à cette évaluation n’a pas pu être chargé.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Réessayer
          </Button>
          <Button variant="outline" onClick={() => navigate('/nurse/patients')}>
            Retour aux patients
          </Button>
        </div>
      </AnimatedPage>
    );
  }

  if (isLoading) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <p className="text-sm text-[var(--text-muted)]">Chargement de l’évaluation Katz…</p>
      </AnimatedPage>
    );
  }

  if (!patient) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-3">
        <h2 className="text-lg font-bold">Patient introuvable</h2>
        <Button variant="outline" onClick={() => navigate('/nurse/patients')}>
          Retour aux patients
        </Button>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="px-4 py-6 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Évaluation Katz</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {patient.lastName} {patient.firstName} · Échelle belge 6+2 critères
          </p>
        </div>
      </div>

      {/* Live score */}
      <Card gradient className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="h-5 w-5 text-mc-blue-500" />
          <div>
            <p className="text-sm font-medium">Score total</p>
            <p className="text-2xl font-bold">{totalScore}</p>
          </div>
        </div>
        <div className="text-right">
          <Badge variant={result.category === 'O' ? 'outline' : result.category === 'Cd' ? 'red' : 'blue'}>
            Catégorie {result.category}
          </Badge>
          <p className="text-xs text-[var(--text-muted)] mt-1">{result.forfait}</p>
        </div>
      </Card>

      {/* AI suggestion banner */}
      <Card className="flex items-center gap-3 border-mc-blue-200 dark:border-mc-blue-800" padding="sm">
        <Brain className="h-5 w-5 text-mc-blue-500 shrink-0" />
        <p className="text-xs text-[var(--text-secondary)]">
          Les données cliniques actuelles suggèrent <strong>{currentKatzLabel}</strong>. Utilisez cette vue comme point de départ avant validation infirmière.
        </p>
      </Card>

      {/* Criteria */}
      <div className="space-y-3">
        {katzCriteria.map((criterion) => (
          <Card key={criterion.id}>
            <div className="mb-2">
              <p className="text-sm font-semibold">{criterion.label}</p>
              <p className="text-xs text-[var(--text-muted)]">{criterion.description}</p>
            </div>
            <div className="flex gap-1.5">
              {criterion.scores.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setScores(prev => ({ ...prev, [criterion.id]: option.value }))}
                  className={`flex-1 py-2 px-1 rounded-lg text-[11px] font-medium text-center transition-all ${
                    scores[criterion.id] === option.value
                      ? 'bg-mc-blue-500 text-white shadow-sm'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-default)]'
                  }`}
                >
                  <span className="block text-lg font-bold">{option.value}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Submit */}
      <Button variant="gradient" size="lg" className="w-full" disabled={!allFilled}>
        <CheckCircle className="h-4 w-4" />
        Valider l'évaluation — Catégorie {result.category}
      </Button>
    </AnimatedPage>
  );
}
