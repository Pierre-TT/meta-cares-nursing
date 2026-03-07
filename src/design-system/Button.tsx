import { type ReactNode, forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
type Size = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-mc-blue-500 text-white hover:bg-mc-blue-600 active:bg-mc-blue-700 shadow-sm hover:shadow-md',
  secondary:
    'bg-mc-green-500 text-white hover:bg-mc-green-600 active:bg-mc-green-700 shadow-sm hover:shadow-md',
  outline:
    'border border-[var(--border-default)] text-[var(--text-primary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)]',
  ghost:
    'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
  danger:
    'bg-mc-red-500 text-white hover:bg-mc-red-600 active:bg-mc-red-600 shadow-sm',
  gradient:
    'bg-[image:var(--gradient-brand)] text-white hover:opacity-90 active:opacity-80 shadow-md hover:shadow-lg',
};

const sizeStyles: Record<Size, string> = {
  xs: 'h-8 px-2.5 text-xs gap-1.5 rounded-lg',
  sm: 'h-9 px-3 text-sm gap-2 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      icon,
      iconRight,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mc-blue-500',
          'disabled:opacity-50 disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children && <span>{children}</span>}
        {iconRight && <span className="shrink-0">{iconRight}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export { Button, type ButtonProps };
