import type { ReactNode } from 'react';
import { useState } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { cn } from '@/lib/cn';

interface SwipeAction {
  icon: ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

interface SwipeableCardProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  className?: string;
}

const ACTION_WIDTH = 72;

export function SwipeableCard({
  children,
  leftActions = [],
  rightActions = [],
  className,
}: SwipeableCardProps) {
  const [swiped, setSwiped] = useState<'left' | 'right' | null>(null);
  const x = useMotionValue(0);
  const rightWidth = rightActions.length * ACTION_WIDTH;
  const leftWidth = leftActions.length * ACTION_WIDTH;

  const borderRadius = useTransform(x, [-rightWidth, 0, leftWidth], [16, 16, 16]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 40;
    if (info.offset.x < -threshold && rightActions.length > 0) {
      setSwiped('right');
    } else if (info.offset.x > threshold && leftActions.length > 0) {
      setSwiped('left');
    } else {
      setSwiped(null);
    }
  };

  const getAnimateX = () => {
    if (swiped === 'right') return -rightWidth;
    if (swiped === 'left') return leftWidth;
    return 0;
  };

  return (
    <div className={cn('relative overflow-hidden rounded-2xl', className)}>
      {/* Right actions (revealed when swiping left) */}
      {rightActions.length > 0 && (
        <div className="absolute inset-y-0 right-0 flex">
          {rightActions.map((action, i) => (
            <button
              key={i}
              onClick={() => { action.onClick(); setSwiped(null); }}
              className={cn(
                'flex flex-col items-center justify-center text-white text-[10px] font-medium gap-1',
                action.color
              )}
              style={{ width: ACTION_WIDTH }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Left actions (revealed when swiping right) */}
      {leftActions.length > 0 && (
        <div className="absolute inset-y-0 left-0 flex">
          {leftActions.map((action, i) => (
            <button
              key={i}
              onClick={() => { action.onClick(); setSwiped(null); }}
              className={cn(
                'flex flex-col items-center justify-center text-white text-[10px] font-medium gap-1',
                action.color
              )}
              style={{ width: ACTION_WIDTH }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Main card content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -rightWidth, right: leftWidth }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={{ x: getAnimateX() }}
        style={{ x, borderRadius }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative z-10 bg-[var(--bg-primary)] border border-[var(--border-default)] p-4 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
        onTap={() => swiped && setSwiped(null)}
      >
        {children}
      </motion.div>
    </div>
  );
}
