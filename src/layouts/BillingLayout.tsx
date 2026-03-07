import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  AlertCircle,
  PenSquare,
  FileBarChart,
  Package,
  BookOpen,
  Layers,
  Scale,
  BarChart3,
  User,
  Shield,
  Calculator,
  Building2,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/authStore';
import { useState } from 'react';

interface NavGroup {
  title: string;
  items: { path: string; icon: React.ComponentType<{ className?: string }>; label: string }[];
}

interface BillingNavItemsProps {
  isActive: (path: string) => boolean;
  onNavigate: (path: string) => void;
}

const navGroups: NavGroup[] = [
  {
    title: 'Facturation',
    items: [
      { path: '/billing', icon: LayoutDashboard, label: 'Tableau de bord' },
      { path: '/billing/queue', icon: Inbox, label: 'File de travail' },
      { path: '/billing/batches', icon: Package, label: 'Lots eFact' },
      { path: '/billing/rejections', icon: AlertCircle, label: 'Rejets' },
      { path: '/billing/corrections', icon: PenSquare, label: 'Corrections' },
    ],
  },
  {
    title: 'Référentiel',
    items: [
      { path: '/billing/nomenclature', icon: BookOpen, label: 'Nomenclature' },
      { path: '/billing/cumul-rules', icon: Layers, label: 'Règles cumul' },
      { path: '/billing/mutuelles', icon: Building2, label: 'Mutuelles' },
    ],
  },
  {
    title: 'Analyse',
    items: [
      { path: '/billing/reconciliation', icon: Scale, label: 'Rapprochement' },
      { path: '/billing/nurse-stats', icon: BarChart3, label: 'Productivité' },
      { path: '/billing/patient-account', icon: User, label: 'Comptes patients' },
      { path: '/billing/reports', icon: FileBarChart, label: 'Rapports' },
      { path: '/billing/simulator', icon: Calculator, label: 'Simulateur' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { path: '/billing/agreements', icon: Shield, label: 'Accords' },
      { path: '/billing/audit', icon: ShieldCheck, label: 'Audit' },
      { path: '/billing/settings', icon: Settings, label: 'Paramètres' },
    ],
  },
];

function BillingNavItems({ isActive, onNavigate }: BillingNavItemsProps) {
  return (
    <>
      {navGroups.map((group) => (
        <div key={group.title} className="mb-3">
          <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
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

export function BillingLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/billing') return location.pathname === '/billing';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-[100dvh]">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[var(--border-default)] bg-[var(--bg-primary)]">
        <div className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#47B6FF] to-[#4ABD33] flex items-center justify-center text-white text-xs font-bold">MB</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold truncate">
              <span className="text-gradient">Meta Cares</span>
            </h1>
            <p className="text-[10px] text-[var(--text-muted)]">Bureau Tarification</p>
          </div>
          <button className="relative p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
            <Bell className="h-4 w-4 text-[var(--text-muted)]" />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-mc-red-500" />
          </button>
        </div>
        <nav className="flex-1 px-3 overflow-y-auto space-y-1">
          <BillingNavItems
            isActive={isActive}
            onNavigate={(path) => {
              navigate(path);
              setMobileOpen(false);
            }}
          />
        </nav>
        <div className="p-3 border-t border-[var(--border-default)]">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-mc-red-500 hover:bg-mc-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-[var(--bg-primary)] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <h1 className="text-base font-bold text-gradient">Meta Cares</h1>
              <button onClick={() => setMobileOpen(false)} className="p-1">
                <X className="h-5 w-5 text-[var(--text-muted)]" />
              </button>
            </div>
            <nav className="flex-1 p-3 overflow-y-auto space-y-1">
              <BillingNavItems
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

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        <header className="lg:hidden sticky top-0 z-30 glass border-b border-[var(--border-default)]">
          <div className="flex items-center h-14 px-4">
            <button onClick={() => setMobileOpen(true)} className="mr-3">
              <Menu className="h-5 w-5 text-[var(--text-secondary)]" />
            </button>
            <h1 className="text-sm font-bold text-gradient">Meta Cares</h1>
            <span className="text-xs text-[var(--text-muted)] ml-2">Bureau Tarification</span>
            <button className="relative ml-auto p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)]">
              <Bell className="h-4 w-4 text-[var(--text-muted)]" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-mc-red-500" />
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
