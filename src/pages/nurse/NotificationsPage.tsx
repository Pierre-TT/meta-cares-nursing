import { useState } from 'react';
import { BellRing, Trash2, AlertTriangle, Euro, Calendar, Shield, CheckCheck } from 'lucide-react';
import { Card, Badge, Button, AnimatedPage, GradientHeader, ContentTabs } from '@/design-system';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: 'clinical' | 'billing' | 'planning' | 'compliance';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionPath?: string;
}

const allNotifications: Notification[] = [
  { id: '1', type: 'clinical', title: 'Glycémie critique', message: 'Mme Dubois — 312 mg/dL détecté à 08:45. Action requise.', time: 'Il y a 15 min', read: false, actionPath: '/nurse/patients/p1' },
  { id: '2', type: 'billing', title: 'Accord approuvé', message: 'Forfait B — Dubois Marie approuvé par MC 200', time: 'Il y a 30 min', read: false, actionPath: '/nurse/eagreement' },
  { id: '3', type: 'clinical', title: 'Rappel photo plaie J+7', message: 'Lambert Jeanne — plaie sacrum stade III. Photo requise aujourd\'hui.', time: 'Il y a 1h', read: false, actionPath: '/nurse/wounds/p3' },
  { id: '4', type: 'planning', title: 'Visite ajoutée', message: 'Coordinateur a ajouté Lambert Jeanne à votre tournée de demain (09:30)', time: 'Il y a 1h30', read: false, actionPath: '/nurse/tour' },
  { id: '5', type: 'billing', title: 'eFact accepté', message: 'Lot EF-2025-03-0422 accepté — €44.73', time: 'Il y a 2h', read: true, actionPath: '/nurse/billing/efact' },
  { id: '6', type: 'compliance', title: 'Journal non signé', message: '3 entrées du journal de soins du 05/03 non signées', time: 'Il y a 2h', read: true, actionPath: '/nurse/journal' },
  { id: '7', type: 'planning', title: 'Téléconsultation programmée', message: 'Appel vidéo avec Janssen Pierre demain à 15:30', time: 'Il y a 3h', read: true, actionPath: '/nurse/teleconsultation' },
  { id: '8', type: 'billing', title: 'Rejet eFact', message: 'Lot EF-2025-03-0419 — 1 rejet: cumul non autorisé', time: 'Il y a 4h', read: true, actionPath: '/nurse/billing/efact' },
  { id: '9', type: 'compliance', title: 'eAgreement expire bientôt', message: 'Janssen Pierre — forfait C expire dans 5 jours', time: 'Il y a 5h', read: true, actionPath: '/nurse/eagreement' },
  { id: '10', type: 'clinical', title: 'BelRAI à renouveler', message: 'Dubois Marie — BelRAI Screener expire le 15/04', time: 'Hier', read: true, actionPath: '/nurse/belrai/p1' },
  { id: '11', type: 'planning', title: 'Absence approuvée', message: 'Votre demande de congé du 20/03 au 22/03 a été approuvée', time: 'Hier', read: true, actionPath: '/nurse/schedule' },
  { id: '12', type: 'compliance', title: 'Katz annuel requis', message: 'Janssen Pierre — réévaluation Katz annuelle requise avant le 20/03', time: 'Hier', read: true, actionPath: '/nurse/katz/p2' },
];

const typeConfig = {
  clinical: { label: 'Clinique', icon: AlertTriangle, color: 'text-mc-red-500', bg: 'bg-mc-red-50 dark:bg-red-900/30' },
  billing: { label: 'Facturation', icon: Euro, color: 'text-mc-green-500', bg: 'bg-mc-green-50 dark:bg-mc-green-900/30' },
  planning: { label: 'Planning', icon: Calendar, color: 'text-mc-blue-500', bg: 'bg-mc-blue-50 dark:bg-mc-blue-900/30' },
  compliance: { label: 'Conformité', icon: Shield, color: 'text-mc-amber-500', bg: 'bg-mc-amber-50 dark:bg-amber-900/30' },
};

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(allNotifications);

  const markAsRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const removeNotif = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderList = (items: Notification[]) => (
    <div className="space-y-2">
      {items.length === 0 && (
        <div className="text-center py-8 text-sm text-[var(--text-muted)]">Aucune notification</div>
      )}
      {items.map(n => {
        const cfg = typeConfig[n.type];
        const Icon = cfg.icon;
        return (
          <Card
            key={n.id}
            hover
            padding="sm"
            className={`cursor-pointer ${!n.read ? 'border-l-4 border-l-mc-blue-500' : ''}`}
            onClick={() => { markAsRead(n.id); if (n.actionPath) navigate(n.actionPath); }}
          >
            <div className="flex items-start gap-3">
              <div className={`h-9 w-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-4 w-4 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm truncate ${!n.read ? 'font-bold' : 'font-medium'}`}>{n.title}</p>
                  <Badge variant={n.type === 'clinical' ? 'red' : n.type === 'billing' ? 'green' : n.type === 'planning' ? 'blue' : 'amber'}>
                    {cfg.label}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">{n.time}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!n.read && <div className="h-2.5 w-2.5 rounded-full bg-mc-blue-500" />}
                <button
                  onClick={e => { e.stopPropagation(); removeNotif(n.id); }}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  const tabs = [
    { id: 'all', label: `Tout (${notifications.length})`, content: renderList(notifications) },
    { id: 'clinical', label: 'Clinique', content: renderList(notifications.filter(n => n.type === 'clinical')) },
    { id: 'billing', label: 'Facturation', content: renderList(notifications.filter(n => n.type === 'billing')) },
    { id: 'planning', label: 'Planning', content: renderList(notifications.filter(n => n.type === 'planning')) },
    { id: 'compliance', label: 'Conformité', content: renderList(notifications.filter(n => n.type === 'compliance')) },
  ];

  return (
    <AnimatedPage className="px-4 py-6 max-w-lg mx-auto space-y-4">
      <GradientHeader
        icon={<BellRing className="h-5 w-5" />}
        title="Notifications"
        subtitle="Centre de notifications"
        badge={unreadCount > 0 ? <Badge variant="blue">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</Badge> : undefined}
      >
        <div className="flex items-center justify-around mt-1">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{notifications.length}</p>
            <p className="text-[10px] text-white/60">Total</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{unreadCount}</p>
            <p className="text-[10px] text-white/60">Non lues</p>
          </div>
          <div className="h-6 w-px bg-white/20" />
          <div className="text-center">
            <p className="text-lg font-bold text-white">{notifications.filter(n => n.type === 'clinical' && !n.read).length}</p>
            <p className="text-[10px] text-white/60">Alertes</p>
          </div>
        </div>
      </GradientHeader>

      {unreadCount > 0 && (
        <Button variant="outline" size="sm" className="w-full gap-1" onClick={markAllRead}>
          <CheckCheck className="h-3.5 w-3.5" /> Tout marquer comme lu
        </Button>
      )}

      <ContentTabs tabs={tabs} />
    </AnimatedPage>
  );
}
