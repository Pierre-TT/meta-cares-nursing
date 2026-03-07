import { useEffect, useRef } from 'react';
import { useSpring, useMotionValue, motion } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  /** Prefix string (e.g. "€") */
  prefix?: string;
  /** Suffix string (e.g. "%", " km") */
  suffix?: string;
  /** Number of decimal places */
  decimals?: number;
  /** Duration in seconds */
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 0.8,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 20,
    duration: duration * 1000,
  });

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${latest.toFixed(decimals)}${suffix}`;
      }
    });
    return unsubscribe;
  }, [springValue, prefix, suffix, decimals]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      {prefix}0{suffix}
    </motion.span>
  );
}
