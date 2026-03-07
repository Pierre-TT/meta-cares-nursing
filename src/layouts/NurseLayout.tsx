import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Route,
  Users,
  Receipt,
  MoreHorizontal,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useI18n } from '@/stores/i18nStore';
import type { TranslationKey } from '@/stores/i18nStore';
import { OfflineIndicator } from '@/components/nurse/OfflineIndicator';

const tabs: { path: string; icon: typeof LayoutDashboard; i18nKey: TranslationKey; badge?: number }[] = [
  { path: '/nurse', icon: LayoutDashboard, i18nKey: 'nav.dashboard' },
  { path: '/nurse/tour', icon: Route, i18nKey: 'nav.tour' },
  { path: '/nurse/patients', icon: Users, i18nKey: 'nav.patients' },
  { path: '/nurse/billing', icon: Receipt, i18nKey: 'nav.billing', badge: 2 },
  { path: '/nurse/more', icon: MoreHorizontal, i18nKey: 'nav.more', badge: 3 },
];

export function NurseLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useI18n((s) => s.t);

  const isActive = (path: string) => {
    if (path === '/nurse') return location.pathname === '/nurse';
    return location.pathname.startsWith(path);
  };

  const notifCount = 4; // TODO: wire to real notification store

  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* Top status bar */}
      <header className="sticky top-0 z-30 flex items-center justify-end gap-2 px-4 py-2 pt-[env(safe-area-inset-top)]">
        <OfflineIndicator />
        <button
          onClick={() => navigate('/nurse/notifications')}
          className="relative h-9 w-9 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <Bell className="h-4 w-4 text-[var(--text-muted)]" />
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-mc-red-500 text-white text-[9px] font-bold badge-pulse">
              {notifCount}
            </span>
          )}
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 glass-strong border-t border-[var(--border-default)]">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2 pb-[env(safe-area-inset-bottom)]">
          {tabs.map((tab) => {
            const active = isActive(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center justify-center w-16 h-full gap-0.5"
              >
                {active && (
                  <motion.div
                    layoutId="bottomtab"
                    className="absolute -top-px left-2 right-2 h-0.5 rounded-full bg-[image:var(--gradient-brand)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Icon with gradient fill when active */}
                <div className="relative">
                  <tab.icon
                    className={cn(
                      'h-5 w-5 transition-colors',
                      active ? 'text-mc-blue-500' : 'text-[var(--text-muted)]'
                    )}
                  />
                  {/* Badge dot / count */}
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-mc-red-500 text-white text-[9px] font-bold badge-pulse">
                      {tab.badge}
                    </span>
                  )}
                </div>

                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors',
                    active ? 'text-mc-blue-500' : 'text-[var(--text-muted)]'
                  )}
                >
                  {t(tab.i18nKey)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
