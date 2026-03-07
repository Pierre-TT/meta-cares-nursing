import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}
    >
      <div className="h-14 w-14 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-4 text-[var(--text-muted)]">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-[var(--text-muted)] max-w-xs mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </motion.div>
  );
}
