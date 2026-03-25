import { AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/design-system';

interface MockFeatureNoticeProps {
  feature: string;
  className?: string;
}

export function MockFeatureNotice({ feature, className }: MockFeatureNoticeProps) {
  return (
    <div className={className ?? 'px-4 py-6 max-w-2xl mx-auto'}>
      <Card className="border border-amber-200/70 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/5">
        <CardHeader className="gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <CardTitle>Surface en préparation</CardTitle>
        </CardHeader>
        <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200">
          La fonctionnalité « {feature} » s’appuie encore sur des données de démonstration.
          Elle est visible en environnement de test uniquement et sera connectée aux services eHealth
          (Vitalink, MyCareNet, eHealthBox, etc.) avant la mise en production.
        </p>
      </Card>
    </div>
  );
}
