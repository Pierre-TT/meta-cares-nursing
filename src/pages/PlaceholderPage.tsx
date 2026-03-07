import { Construction } from 'lucide-react';
import { AnimatedPage, Button } from '@/design-system';
import { useNavigate } from 'react-router-dom';

export function PlaceholderPage({ title }: { title: string }) {
  const navigate = useNavigate();
  return (
    <AnimatedPage className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-[image:var(--gradient-brand)] flex items-center justify-center mb-4">
        <Construction className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-xl font-bold mb-1">{title}</h2>
      <p className="text-sm text-[var(--text-muted)] mb-6 max-w-xs">
        Cet écran sera développé dans les prochaines étapes du plan d'exécution.
      </p>
      <Button variant="outline" onClick={() => navigate(-1)}>
        Retour
      </Button>
    </AnimatedPage>
  );
}
