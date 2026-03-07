import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { cn } from '@/lib/cn';

interface StatRingProps {
  value: number;
  max: number;
  label: string;
  suffix?: string;
  size?: number;
  strokeWidth?: number;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'gradient';
  className?: string;
}

const colorMap = {
  blue: { stroke: 'stroke-mc-blue-500', text: 'text-mc-blue-500' },
  green: { stroke: 'stroke-mc-green-500', text: 'text-mc-green-500' },
  amber: { stroke: 'stroke-mc-amber-500', text: 'text-mc-amber-500' },
  red: { stroke: 'stroke-mc-red-500', text: 'text-mc-red-500' },
  gradient: { stroke: '', text: 'text-gradient' },
};

export function StatRing({
  value,
  max,
  label,
  suffix = '',
  size = 80,
  strokeWidth = 6,
  color = 'blue',
  className,
}: StatRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeMax = max > 0 ? max : Math.max(value, 1);
  const pct = max > 0 ? Math.min(value / safeMax, 1) : 0;

  const spring = useSpring(0, { stiffness: 60, damping: 15 });
  const dashOffset = useTransform(spring, (v: number) => circumference * (1 - v));
  const displayValue = useTransform(spring, (v: number) =>
    max > 0 ? Math.round(v * safeMax) : value
  );

  useEffect(() => {
    spring.set(pct);
  }, [pct, spring]);

  const isGradient = color === 'gradient';
  const colors = colorMap[color];

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {isGradient && (
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#47B6FF" />
                <stop offset="100%" stopColor="#4ABD33" />
              </linearGradient>
            </defs>
          )}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-[var(--bg-tertiary)]"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: dashOffset }}
            stroke={isGradient ? 'url(#ringGrad)' : undefined}
            className={isGradient ? '' : colors.stroke}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-lg font-bold', colors.text)}>
            <motion.span>{displayValue}</motion.span>
            {suffix && <span className="text-xs font-medium">{suffix}</span>}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-medium text-[var(--text-muted)] text-center leading-tight">
        {label}
      </span>
    </div>
  );
}