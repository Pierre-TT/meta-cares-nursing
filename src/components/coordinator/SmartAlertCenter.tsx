import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, UserX, FileWarning, Shield, X, Check, Bell } from 'lucide-react';
import { Card, Badge } from '@/design-system';
import { featureFlags } from '@/lib/featureFlags';
import { MockFeatureNotice } from '@/components/MockFeatureNotice';

interface SmartAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'absence' | 'delay' | 'compliance' | 'safety';
  title: string;
  detail: string;
  time: string;
  autoEscalateMin?: number;
}

const mockAlerts: SmartAlert[] = [
  { id: 'a1', severity: 'critical', category: 'absence', title: 'Infirmière absente non remplacée', detail: 'Sophie Dupuis — 4 visites non couvertes ce matin', time: '06:45', autoEscalateMin: 15 },
  { id: 'a2', severity: 'critical', category: 'safety', title: 'Chute patient signalée', detail: 'M. Janssens — visite #387 à 08:20 — incident ouvert', time: '08:22' },
  { id: 'a3', severity: 'warning', category: 'delay', title: 'Retard > 30 min', detail: 'Thomas Maes — visite Mme Peeters prévue à 10:00', time: '10:32', autoEscalateMin: 10 },
  { id: 'a4', severity: 'warning', category: 'compliance', title: 'Visa INAMI expiré', detail: 'Laura Van Damme — renouvellement en attente depuis 3j', time: '07:00' },
  { id: 'a5', severity: 'info', category: 'compliance', title: 'eFact rejeté #892', detail: 'Motif: code nomenclature invalide — patient Dubois', time: '09:15' },
];

const severityStyles = {
  critical: 'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/15',
  warning: 'border-l-4 border-l-mc-amber-500 bg-mc-amber-50 dark:bg-amber-900/15',
  info: 'border-l-4 border-l-mc-blue-500 bg-mc-blue-50 dark:bg-mc-blue-900/15',
};

const categoryIcons = { absence: UserX, delay: Clock, compliance: FileWarning, safety: Shield };

export function SmartAlertCenter() {
  const [alerts, setAlerts] = useState(mockAlerts);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  if (!featureFlags.enableHealthcareMocks) {
    return <MockFeatureNotice feature="Centre d'alertes intelligent" />;
  }

  const dismiss = (id: string) => setAlerts(prev => prev.filter(a => a.id !== id));
  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <Bell className="h-5 w-5 text-[var(--text-secondary)]" />
          {criticalCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              {criticalCount}
            </span>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">Centre d'alertes intelligent</p>
          <p className="text-[10px] text-[var(--text-muted)]">{alerts.length} alertes actives</p>
        </div>
      </div>

      <div className="flex gap-1.5 mb-3">
        {([['all', 'Toutes', alerts.length], ['critical', 'Critiques', alerts.filter(a => a.severity === 'critical').length], ['warning', 'Avert.', alerts.filter(a => a.severity === 'warning').length], ['info', 'Info', alerts.filter(a => a.severity === 'info').length]] as const).map(([v, l, c]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-2 py-1 rounded-full text-[10px] font-medium ${filter === v ? 'bg-[image:var(--gradient-brand)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'}`}>
            {l} ({c})
          </button>
        ))}
      </div>

      <AnimatePresence mode="popLayout">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filtered.map(alert => {
            const CatIcon = categoryIcons[alert.category];
            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                className={`p-2 rounded-lg ${severityStyles[alert.severity]}`}
              >
                <div className="flex items-start gap-2">
                  <CatIcon className={`h-4 w-4 mt-0.5 shrink-0 ${alert.severity === 'critical' ? 'text-red-500' : alert.severity === 'warning' ? 'text-mc-amber-500' : 'text-mc-blue-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold">{alert.title}</p>
                      {alert.autoEscalateMin && (
                        <Badge variant="red">Escalade {alert.autoEscalateMin}min</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)]">{alert.detail}</p>
                    <p className="text-[9px] text-[var(--text-muted)] mt-0.5">{alert.time}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => dismiss(alert.id)} className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5">
                      <Check className="h-3.5 w-3.5 text-mc-green-500" />
                    </button>
                    <button onClick={() => dismiss(alert.id)} className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5">
                      <X className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <p className="text-center text-xs text-[var(--text-muted)] py-4">Aucune alerte dans cette catégorie</p>
      )}
    </Card>
  );
}
