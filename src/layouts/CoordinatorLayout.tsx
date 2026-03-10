import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarDays,
  Map,
  Users,
  MoreHorizontal,
  Receipt,
  BarChart3,
  Clock,
  ArrowRightLeft,
  MessageSquare,
  CalendarOff,
  Heart,
  ShieldCheck,
  GitBranch,
  Bell,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { roleProfileRoutes, useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/design-system';

/* ── Navigation sections ── */

const sidebarSections = [
  {
    title: 'Opérations',
    items: [
      { path: '/coordinator', icon: LayoutDashboard, label: 'Dashboard', badge: 0 },
      { path: '/coordinator/planning', icon: CalendarDays, label: 'Planning', badge: 3 },
      { path: '/coordinator/map', icon: Map, label: 'Carte live', badge: 0 },
      { path: '/coordinator/messages', icon: MessageSquare, label: 'Messages', badge: 2 },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { path: '/coordinator/team', icon: Users, label: 'Équipe', badge: 0 },
      { path: '/coordinator/shifts', icon: Clock, label: 'Shifts', badge: 0 },
      { path: '/coordinator/absences', icon: CalendarOff, label: 'Absences', badge: 0 },
      { path: '/coordinator/caseload', icon: Heart, label: 'Charge patients', badge: 0 },
    ],
  },
  {
    title: 'Analyse',
    items: [
      { path: '/coordinator/billing', icon: Receipt, label: 'Facturation', badge: 0 },
      { path: '/coordinator/stats', icon: BarChart3, label: 'Statistiques', badge: 0 },
      { path: '/coordinator/reconciliation', icon: ArrowRightLeft, label: 'Rapprochement', badge: 0 },
      { path: '/coordinator/quality', icon: ShieldCheck, label: 'Qualité', badge: 0 },
      { path: '/coordinator/continuity', icon: GitBranch, label: 'Continuité', badge: 0 },
    ],
  },
];

const mobileTabs = [
  { path: '/coordinator', icon: LayoutDashboard, label: 'Accueil', badge: 0 },
  { path: '/coordinator/planning', icon: CalendarDays, label: 'Planning', badge: 3 },
  { path: '/coordinator/map', icon: Map, label: 'Carte', badge: 0 },
  { path: '/coordinator/team', icon: Users, label: 'Équipe', badge: 0 },
  { path: '/coordinator/more', icon: MoreHorizontal, label: 'Plus', badge: 0 },
];

export function CoordinatorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const profilePath = user ? roleProfileRoutes[user.role] : '/coordinator/profile';

  const isActive = (path: string) => {
    if (path === '/coordinator') return location.pathname === '/coordinator';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-[100dvh]">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[var(--border-default)] bg-[var(--bg-primary)]">
        {/* Brand + notification */}
        <div className="p-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">
              <span className="text-gradient">Meta Cares</span>
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 uppercase tracking-wider font-semibold">Coordinateur</p>
          </div>
          <button
            onClick={() => navigate('/coordinator/messages')}
            className="relative h-9 w-9 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center hover:bg-[var(--border-subtle)] transition-colors"
          >
            <Bell className="h-4 w-4 text-[var(--text-secondary)]" />
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-mc-red-500 text-white text-[9px] font-bold flex items-center justify-center badge-pulse">
              3
            </span>
          </button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 px-3 space-y-5 overflow-y-auto">
          {sidebarSections.map((section) => (
            <div key={section.title}>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] px-3 mb-1.5">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={cn(
                        'flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                        active
                          ? 'bg-[image:var(--gradient-brand-subtle)] text-mc-blue-600 dark:text-mc-blue-400'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge > 0 && (
                        <span className="h-5 min-w-5 px-1.5 rounded-full bg-mc-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Profile footer */}
        <div className="p-3 space-y-1 border-t border-[var(--border-default)]">
          <button
            type="button"
            onClick={() => navigate(profilePath)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
          >
              <Avatar
                src={user?.avatarUrl}
                name={`${user?.firstName ?? 'Meta'} ${user?.lastName ?? 'Cares'}`}
                size="sm"
              />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate">
                {user ? `${user.firstName} ${user.lastName}` : 'Mon profil'}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">Modifier le profil</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
          </button>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-mc-red-500 hover:bg-mc-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
          <Outlet />
        </main>

        {/* ── Mobile Bottom Tab Bar ── */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass-strong border-t border-[var(--border-default)]">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2 pb-[env(safe-area-inset-bottom)]">
            {mobileTabs.map((tab) => {
              const active = isActive(tab.path);
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className="relative flex flex-col items-center justify-center w-16 h-full gap-0.5"
                >
                  {active && (
                    <motion.div
                      layoutId="coord-tab"
                      className="absolute -top-px left-2 right-2 h-0.5 rounded-full bg-[image:var(--gradient-brand)]"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <tab.icon
                    className={cn(
                      'h-5 w-5 transition-colors',
                      active ? 'text-mc-blue-500' : 'text-[var(--text-muted)]'
                    )}
                  />
                  <span
                    className={cn(
                      'text-[10px] font-medium transition-colors',
                      active ? 'text-mc-blue-500' : 'text-[var(--text-muted)]'
                    )}
                  >
                    {tab.label}
                  </span>
                  {tab.badge > 0 && (
                    <span className="absolute -top-0.5 right-2 h-4 min-w-4 px-1 rounded-full bg-mc-red-500 text-white text-[9px] font-bold flex items-center justify-center badge-pulse">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
