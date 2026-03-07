import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        'flex gap-1 p-1 rounded-xl bg-[var(--bg-tertiary)]',
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            activeTab === tab.id
              ? 'text-[var(--text-primary)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          )}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute inset-0 bg-[var(--bg-primary)] rounded-lg shadow-sm"
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  activeTab === tab.id
                    ? 'bg-mc-blue-100 text-mc-blue-700 dark:bg-mc-blue-900/40 dark:text-mc-blue-300'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                )}
              >
                {tab.count}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ── ContentTabs: self-managed tabs with content panels ── */

interface ContentTab {
  label: string;
  content: React.ReactNode;
}

export function ContentTabs({ tabs, className }: { tabs: ContentTab[]; className?: string }) {
  const [active, setActive] = useState(0);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-tertiary)] overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={cn(
              'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              active === i
                ? 'text-[var(--text-primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            )}
          >
            {active === i && (
              <motion.div
                layoutId="content-tab-indicator"
                className="absolute inset-0 bg-[var(--bg-primary)] rounded-lg shadow-sm"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {tabs[active]?.content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
