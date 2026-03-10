import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Heart,
  Pill,
  FileText,
  MoreHorizontal,
  Bell,
  Settings,
  Phone,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Avatar } from '@/design-system';
import { roleProfileRoutes, useAuthStore } from '@/stores/authStore';

/* ── Bottom tabs ── */
const tabs = [
  { path: '/patient', icon: Home, label: 'Accueil' },
  { path: '/patient/health', icon: Heart, label: 'Santé' },
  { path: '/patient/treatments', icon: Pill, label: 'Traitements' },
  { path: '/patient/documents', icon: FileText, label: 'Documents' },
  { path: '/patient/more', icon: MoreHorizontal, label: 'Plus' },
];

export function PatientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const profilePath = user ? roleProfileRoutes[user.role] : '/patient/profile';
  const firstName = user?.firstName ?? 'Patient';
  const lastName = user?.lastName ?? '';

  const isActive = (path: string) => {
    if (path === '/patient') return location.pathname === '/patient';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[var(--bg-primary)]">
      {/* ── Top Header ── */}
      <header className="glass sticky top-0 z-30 border-b border-[var(--border-default)]">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatarUrl} name={`${firstName} ${lastName}`.trim()} size="sm" />
            <div>
              <h1 className="text-sm font-bold">
                Bonjour <span className="text-gradient">{firstName}</span>
              </h1>
              <p className="text-[10px] text-[var(--text-muted)]">Katz B · INAMI couvert</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/patient/more')}
              className="relative p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-[var(--text-secondary)]" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-mc-red-500 ring-2 ring-[var(--bg-primary)]" />
            </button>
            <button
              onClick={() => navigate(profilePath)}
              className="p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
              aria-label="Paramètres"
            >
              <Settings className="h-5 w-5 text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* ── Floating SOS Button ── */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/patient/more')}
        className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full bg-red-500 shadow-lg shadow-red-500/30 flex items-center justify-center"
        aria-label="SOS Urgence"
      >
        <Phone className="h-6 w-6 text-white" />
        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-white text-red-500 text-[8px] font-black">SOS</span>
      </motion.button>

      {/* ── Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 glass-strong border-t border-[var(--border-default)]">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2 pb-[env(safe-area-inset-bottom)]">
          {tabs.map((tab) => {
            const active = isActive(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center justify-center min-w-[48px] min-h-[48px] w-16 h-full gap-0.5"
              >
                {active && (
                  <motion.div
                    layoutId="patient-tab"
                    className="absolute -top-px left-2 right-2 h-0.5 rounded-full bg-[image:var(--gradient-brand)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <tab.icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    active ? 'text-mc-green-500' : 'text-[var(--text-muted)]'
                  )}
                />
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors',
                    active ? 'text-mc-green-500' : 'text-[var(--text-muted)]'
                  )}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
