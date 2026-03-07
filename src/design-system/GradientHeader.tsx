import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

interface GradientHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'pt-4 pb-4 px-4',
  md: 'pt-6 pb-5 px-4',
  lg: 'pt-8 pb-6 px-4',
};

export function GradientHeader({
  icon,
  title,
  subtitle,
  badge,
  children,
  className,
  size = 'md',
}: GradientHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-2xl mesh-gradient',
        sizeStyles[size],
        className
      )}
    >
      {/* Decorative blurred circles */}
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/5 blur-xl" />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{title}</h1>
              {subtitle && (
                <p className="text-sm text-white/70 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {badge && <div>{badge}</div>}
        </div>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </motion.div>
  );
}
