import { cn } from '@/lib/cn';

type BadgeVariant = 'default' | 'blue' | 'green' | 'amber' | 'red' | 'outline';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
  blue: 'bg-mc-blue-50 text-mc-blue-700 dark:bg-mc-blue-900/30 dark:text-mc-blue-300',
  green: 'bg-mc-green-50 text-mc-green-700 dark:bg-mc-green-900/30 dark:text-mc-green-300',
  amber: 'bg-mc-amber-50 text-mc-amber-600 dark:bg-amber-900/30 dark:text-amber-300',
  red: 'bg-mc-red-50 text-mc-red-600 dark:bg-red-900/30 dark:text-red-300',
  outline: 'border border-[var(--border-default)] text-[var(--text-secondary)]',
};

interface BadgeProps {
  variant?: BadgeVariant;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', dot, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', {
            'bg-[var(--text-muted)]': variant === 'default',
            'bg-mc-blue-500': variant === 'blue',
            'bg-mc-green-500': variant === 'green',
            'bg-mc-amber-500': variant === 'amber',
            'bg-mc-red-500': variant === 'red',
          })}
        />
      )}
      {children}
    </span>
  );
}
