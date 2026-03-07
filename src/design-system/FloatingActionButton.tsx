import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';

interface FABProps {
  icon: ReactNode;
  onClick: () => void;
  label?: string;
  pulse?: boolean;
  className?: string;
}

export function FloatingActionButton({
  icon,
  onClick,
  label,
  pulse = false,
  className,
}: FABProps) {
  return (
    <div className={cn('fixed bottom-20 right-4 z-30', className)}>
      {/* Pulse ring */}
      <AnimatePresence>
        {pulse && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.6 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full bg-[image:var(--gradient-brand)]"
          />
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        onClick={onClick}
        className={cn(
          'relative h-14 w-14 rounded-full bg-[image:var(--gradient-brand)] text-white',
          'shadow-lg shadow-mc-blue-500/25 flex items-center justify-center',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-blue-500'
        )}
        aria-label={label}
      >
        {icon}
      </motion.button>

      {label && (
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-0.5 rounded-full shadow-sm border border-[var(--border-default)]">
          {label}
        </span>
      )}
    </div>
  );
}
