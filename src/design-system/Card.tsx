import type { HTMLAttributes, ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLMotionProps<'div'> {
  glass?: boolean;
  hover?: boolean;
  gradient?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

export function Card({
  className,
  glass = false,
  hover = false,
  gradient = false,
  padding = 'md',
  children,
  ...props
}: CardProps) {

  return (
    <motion.div
      className={cn(
        'rounded-2xl transition-shadow duration-300',
        glass
          ? 'glass'
          : 'bg-[var(--bg-primary)] border border-[var(--border-default)]',
        gradient && 'bg-[image:var(--gradient-brand-subtle)]',
        'shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]',
        paddingStyles[padding],
        className
      )}
      whileHover={hover ? { y: -2, boxShadow: '0 10px 25px -5px rgba(71,182,255,0.1), 0 8px 10px -6px rgba(74,189,51,0.06)' } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
      transition={hover ? { type: 'spring', stiffness: 300, damping: 20 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-base font-semibold text-[var(--text-primary)]', className)} {...props}>
      {children}
    </h3>
  );
}
