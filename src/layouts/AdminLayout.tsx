import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Server,
  FlaskConical,
  Shield,
  ShieldCheck,
  Bell,
  Lock,
  KeyRound,
  Database,
  HeartHandshake,
  Siren,
  HardDrive,
  Settings,
  UserRound,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { roleProfileRoutes, useAuthStore } from '@/stores/authStore';
import { useState } from 'react';
import { Avatar, Badge } from '@/design-system';
import { useAdminPlatformData } from '@/hooks/usePlatformData';

interface NavGroup {
  title: string;
  items: { path: string; icon: React.ComponentType<{ className?: string }>; label: string }[];
}

interface AdminNavItemsProps {
  isActive: (path: string) => boolean;
  onNavigate: (path: string) => void;
}

const navGroups: NavGroup[] = [
  {
    title: 'Vue d’ensemble',
    items: [
      { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/admin/users', icon: Users, label: 'Utilisateurs' },
      { path: '/admin/security', icon: Lock, label: 'Sécurité' },
      { path: '/admin/audit', icon: Shield, label: 'Audit' },
    ],
  },
  {
    title: 'Conformité',
    items: [
      { path: '/admin/rgpd', icon: ShieldCheck, label: 'RGPD' },
      { path: '/admin/data-governance', icon: Database, label: 'Gouvernance data' },
      { path: '/admin/consents', icon: HeartHandshake, label: 'Consentements' },
      { path: '/admin/incidents', icon: Siren, label: 'Incidents' },
    ],
  },
  {
    title: 'Plateforme',
    items: [
      { path: '/admin/nomenclature', icon: BookOpen, label: 'Nomenclature' },
      { path: '/admin/mycarenet', icon: Server, label: 'MyCareNet' },
      { path: '/admin/certificates', icon: KeyRound, label: 'Certificats' },
      { path: '/admin/pilot', icon: FlaskConical, label: 'Pilote horaire' },
      { path: '/admin/backups', icon: HardDrive, label: 'Sauvegardes' },
      { path: '/admin/profile', icon: UserRound, label: 'Mon profil' },
      { path: '/admin/settings', icon: Settings, label: 'Paramètres' },
    ],
  },
];

function AdminNavItems({ isActive, onNavigate }: AdminNavItemsProps) {
  return (
    <>
      {navGroups.map((group) => (
        <div key={group.title} className="mb-4">
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {group.title}
          </p>
          {group.items.map((tab) => {
            const active = isActive(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => onNavigate(tab.path)}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                  active
                    ? 'bg-[image:var(--gradient-brand-subtle)] text-mc-blue-600 dark:text-mc-blue-400'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      ))}
    </>
  );
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data } = useAdminPlatformData();
  const profilePath = user ? roleProfileRoutes[user.role] : '/admin/profile';

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-[100dvh]">
      <aside className="hidden lg:flex flex-col w-72 border-r border-[var(--border-default)] bg-[var(--bg-primary)]">
        <div className="p-4 flex items-center gap-3 border-b border-[var(--border-default)]">
              <Avatar
                src={user?.avatarUrl}
                name={`${user?.firstName ?? 'Meta'} ${user?.lastName ?? 'Cares'}`}
                size="md"
              />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold truncate">
              <span className="text-gradient">Meta Cares</span>
            </h1>
            <p className="text-[10px] text-[var(--text-muted)]">Administration plateforme</p>
          </div>
          <button className="relative p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
            <Bell className="h-4 w-4 text-[var(--text-muted)]" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-mc-red-500" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-[var(--border-default)]">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[image:var(--gradient-brand-subtle)]">
            <div>
              <p className="text-sm font-semibold">Centre opérationnel</p>
              <p className="text-[10px] text-[var(--text-muted)]">
                {data.summary.alertCount} alertes · {data.summary.certificateDeadlines} échéances certif.
              </p>
            </div>
            <Badge variant="amber">Actif</Badge>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1">
          <AdminNavItems
            isActive={isActive}
            onNavigate={(path) => {
              navigate(path);
              setMobileOpen(false);
            }}
          />
        </nav>

        <div className="p-3 border-t border-[var(--border-default)]">
          <button
            type="button"
            onClick={() => navigate(profilePath)}
            className="flex items-center gap-3 w-full p-3 rounded-2xl bg-[var(--bg-secondary)] mb-2 hover:bg-[var(--bg-tertiary)] transition-colors"
          >
                <Avatar
                  src={user?.avatarUrl}
                  name={`${user?.firstName ?? 'Meta'} ${user?.lastName ?? 'Cares'}`}
                  size="sm"
                />
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-medium truncate">
                {user ? `${user.firstName} ${user.lastName}` : 'Mon profil'}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">{user?.email ?? 'Modifier le profil'}</p>
            </div>
            <Badge variant="green">Profil</Badge>
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

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-[var(--bg-primary)] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <div>
                <h1 className="text-base font-bold text-gradient">Meta Cares</h1>
                <p className="text-[10px] text-[var(--text-muted)]">Administration</p>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1">
                <X className="h-5 w-5 text-[var(--text-muted)]" />
              </button>
            </div>
            <nav className="flex-1 p-3 overflow-y-auto space-y-1">
              <AdminNavItems
                isActive={isActive}
                onNavigate={(path) => {
                  navigate(path);
                  setMobileOpen(false);
                }}
              />
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <header className="lg:hidden sticky top-0 z-30 glass border-b border-[var(--border-default)]">
          <div className="flex items-center h-14 px-4">
            <button onClick={() => setMobileOpen(true)} className="mr-3">
              <Menu className="h-5 w-5 text-[var(--text-secondary)]" />
            </button>
            <h1 className="text-sm font-bold text-gradient">Meta Cares</h1>
            <span className="text-xs text-[var(--text-muted)] ml-2">Administration</span>
            <button className="relative ml-auto p-2 rounded-lg hover:bg-[var(--bg-tertiary)]">
              <Bell className="h-4 w-4 text-[var(--text-muted)]" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-mc-red-500" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
