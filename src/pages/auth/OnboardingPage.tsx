import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Shield,
  Zap,
  Wifi,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { Button, AnimatedPage } from '@/design-system';

const steps = [
  {
    icon: Smartphone,
    color: 'from-mc-blue-400 to-mc-blue-600',
    title: 'Identification NFC',
    description:
      'Identifiez vos patients en un geste grâce à leur carte eID via NFC. Plus besoin de vignettes.',
  },
  {
    icon: Shield,
    color: 'from-mc-green-400 to-mc-green-600',
    title: 'Facturation automatique',
    description:
      'Les codes INAMI sont auto-détectés selon vos soins. Cumuls, modulations et eFact gérés automatiquement.',
  },
  {
    icon: Zap,
    color: 'from-mc-blue-500 to-mc-green-500',
    title: 'Assistant IA',
    description:
      'L\'IA analyse vos plaies, pré-remplit les Katz, et détecte les rejets potentiels avant envoi.',
  },
  {
    icon: Wifi,
    color: 'from-mc-blue-400 to-mc-blue-600',
    title: 'Travaillez hors-ligne',
    description:
      'Toutes vos données sont disponibles sans connexion. La synchronisation reprend automatiquement.',
  },
];

export function OnboardingPage() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const isLast = current === steps.length - 1;
  const step = steps[current];

  return (
    <AnimatedPage className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-[image:var(--gradient-brand-subtle)]">
      <div className="w-full max-w-sm space-y-8">
        {/* Step dots */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-8 bg-[image:var(--gradient-brand)]'
                  : i < current
                    ? 'w-2 bg-mc-blue-300'
                    : 'w-2 bg-[var(--border-default)]'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-[var(--bg-primary)] rounded-3xl border border-[var(--border-default)] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.1)] p-8 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center text-center"
            >
              {/* Icon */}
              <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg`}>
                <step.icon className="h-10 w-10 text-white" />
              </div>

              <h2 className="text-xl font-bold mb-2">{step.title}</h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          {current > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrent((c) => c - 1)}
              className="w-12"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="gradient"
            size="lg"
            className="flex-1"
            onClick={() => {
              if (isLast) {
                navigate('/login');
              } else {
                setCurrent((c) => c + 1);
              }
            }}
          >
            {isLast ? (
              <>
                Commencer
                <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                Suivant
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Skip */}
        {!isLast && (
          <button
            onClick={() => navigate('/login')}
            className="block mx-auto text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Passer l'introduction
          </button>
        )}
      </div>
    </AnimatedPage>
  );
}
