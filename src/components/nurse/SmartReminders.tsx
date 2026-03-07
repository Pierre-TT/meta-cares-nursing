import { Bell, Calendar, FileCheck, Camera, Shield, Clock } from 'lucide-react';
import { Card, Badge } from '@/design-system';

interface Reminder {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  dueDate: string;
  urgency: 'high' | 'medium' | 'low';
  action?: string;
}

const reminders: Reminder[] = [
  {
    id: '1',
    icon: <Camera className="h-4 w-4" />,
    title: 'Photo plaie J+7',
    description: 'Lambert Jeanne — Plaie sacrum stade III',
    dueDate: "Aujourd'hui",
    urgency: 'high',
    action: '/nurse/wounds/p3',
  },
  {
    id: '2',
    icon: <FileCheck className="h-4 w-4" />,
    title: 'Renouveler eAgreement',
    description: 'Forfait B — Dubois Marie (exp. 30/06)',
    dueDate: 'Dans 30 jours',
    urgency: 'medium',
    action: '/nurse/eagreement',
  },
  {
    id: '3',
    icon: <Shield className="h-4 w-4" />,
    title: 'Signature journal en attente',
    description: '3 entrées non signées ce jour',
    dueDate: "Aujourd'hui",
    urgency: 'high',
    action: '/nurse/journal',
  },
  {
    id: '4',
    icon: <Calendar className="h-4 w-4" />,
    title: 'Évaluation Katz annuelle',
    description: 'Janssen Pierre — réévaluation requise',
    dueDate: 'Dans 14 jours',
    urgency: 'medium',
    action: '/nurse/katz/p2',
  },
  {
    id: '5',
    icon: <Clock className="h-4 w-4" />,
    title: 'BelRAI Screener expirant',
    description: 'Dubois Marie — valide jusqu\'au 15/04',
    dueDate: 'Dans 40 jours',
    urgency: 'low',
    action: '/nurse/belrai/p1',
  },
];

const urgencyConfig = {
  high: { color: 'bg-mc-red-500', badge: 'red' as const, label: 'Urgent' },
  medium: { color: 'bg-mc-amber-500', badge: 'amber' as const, label: 'Bientôt' },
  low: { color: 'bg-mc-blue-500', badge: 'blue' as const, label: 'Info' },
};

export function SmartReminders({ className = '', max = 5 }: { className?: string; max?: number }) {
  const displayed = reminders.slice(0, max);
  const highCount = reminders.filter(r => r.urgency === 'high').length;

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-mc-amber-500" />
          <span className="text-sm font-semibold">Rappels intelligents</span>
        </div>
        {highCount > 0 && <Badge variant="red">{highCount} urgent{highCount > 1 ? 's' : ''}</Badge>}
      </div>

      <div className="space-y-2">
        {displayed.map(r => {
          const cfg = urgencyConfig[r.urgency];
          return (
            <div key={r.id} className="flex items-center gap-3 py-2 border-b border-[var(--border-subtle)] last:border-0">
              <div className={`h-2 w-2 rounded-full ${cfg.color} shrink-0`} />
              <div className="h-8 w-8 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                {r.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.title}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{r.description}</p>
              </div>
              <div className="text-right shrink-0">
                <Badge variant={cfg.badge}>{r.dueDate}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
