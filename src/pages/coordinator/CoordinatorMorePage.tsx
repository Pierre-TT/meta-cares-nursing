import { useNavigate } from 'react-router-dom';
import {
  Clock,
  ArrowRightLeft,
  CalendarOff,
  Heart,
  ShieldCheck,
  GitBranch,
  MessageSquare,
  Receipt,
  BarChart3,
  Map,
  Settings,
  UserRound,
  LogOut,
  HeartPulse,
} from 'lucide-react';
import { AnimatedPage, GradientHeader } from '@/design-system';
import { roleProfileRoutes, useAuthStore } from '@/stores/authStore';

const sections = [
  {
    title: 'Opérations',
    items: [
      { path: '/coordinator/had-command-center', icon: HeartPulse, label: 'Centre HAD', color: 'bg-mc-red-50 dark:bg-red-900/30 text-mc-red-500', badge: 1 },
      { path: '/coordinator/map', icon: Map, label: 'Carte live', color: 'bg-mc-blue-50 dark:bg-mc-blue-900/30 text-mc-blue-500' },
      { path: '/coordinator/messages', icon: MessageSquare, label: 'Messages', color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-500', badge: 2 },
      { path: '/coordinator/shifts', icon: Clock, label: 'Shifts', color: 'bg-mc-amber-50 dark:bg-amber-900/30 text-mc-amber-500' },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { path: '/coordinator/absences', icon: CalendarOff, label: 'Absences', color: 'bg-mc-red-50 dark:bg-red-900/30 text-mc-red-500' },
      { path: '/coordinator/caseload', icon: Heart, label: 'BelRAI & charge', color: 'bg-mc-green-50 dark:bg-mc-green-900/30 text-mc-green-500' },
      { path: '/coordinator/reconciliation', icon: ArrowRightLeft, label: 'Rapprochement', color: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-500' },
    ],
  },
  {
    title: 'Analyse',
    items: [
      { path: '/coordinator/billing', icon: Receipt, label: 'Facturation', color: 'bg-mc-green-50 dark:bg-mc-green-900/30 text-mc-green-500' },
      { path: '/coordinator/stats', icon: BarChart3, label: 'Statistiques', color: 'bg-mc-blue-50 dark:bg-mc-blue-900/30 text-mc-blue-500' },
      { path: '/coordinator/quality', icon: ShieldCheck, label: 'Qualité', color: 'bg-mc-amber-50 dark:bg-amber-900/30 text-mc-amber-500' },
      { path: '/coordinator/continuity', icon: GitBranch, label: 'Continuité', color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-500' },
    ],
  },
  {
    title: 'Compte',
    items: [
      { path: '/coordinator/profile', icon: UserRound, label: 'Mon profil', color: 'bg-mc-blue-50 dark:bg-mc-blue-900/30 text-mc-blue-500' },
    ],
  },
];

export function CoordinatorMorePage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const profilePath = user ? roleProfileRoutes[user.role] : '/coordinator/profile';

  return (
    <AnimatedPage className="px-4 py-6 lg:px-8 max-w-lg mx-auto space-y-5">
      <GradientHeader
        icon={<Settings className="h-5 w-5" />}
        title="Plus"
        subtitle="Toutes les fonctionnalités"
      />

      {sections.map(section => (
        <div key={section.title}>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-2">{section.title}</p>
          <div className="grid grid-cols-3 gap-3">
            {section.items.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path === '/coordinator/profile' ? profilePath : item.path)}
                className="relative flex flex-col items-center gap-2 p-4 rounded-2xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium text-[var(--text-secondary)] text-center">{item.label}</span>
                {'badge' in item && item.badge! > 0 && (
                  <span className="absolute top-2 right-2 h-4 min-w-4 px-1 rounded-full bg-mc-red-500 text-white text-[9px] font-bold flex items-center justify-center badge-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Logout */}
      <button
        onClick={() => { logout(); navigate('/login'); }}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium text-mc-red-500 bg-mc-red-50 dark:bg-red-900/20 hover:bg-mc-red-100 dark:hover:bg-red-900/30 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Déconnexion
      </button>
    </AnimatedPage>
  );
}
