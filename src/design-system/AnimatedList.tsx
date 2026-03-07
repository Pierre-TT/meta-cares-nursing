import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/* ── Container ── */
interface AnimatedListProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  /** Delay between each child appearing (seconds) */
  stagger?: number;
  /** Initial delay before the first child appears */
  delay?: number;
}

const containerVariants = (stagger: number, delay: number) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});

export function AnimatedList({
  children,
  stagger = 0.05,
  delay = 0.1,
  className,
  ...props
}: AnimatedListProps) {
  return (
    <motion.div
      variants={containerVariants(stagger, delay)}
      initial="hidden"
      animate="visible"
      className={cn('space-y-2', className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ── Item ── */
interface AnimatedItemProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
} satisfies Variants;

export function AnimatedItem({ children, className, ...props }: AnimatedItemProps) {
  return (
    <motion.div variants={itemVariants} className={className} {...props}>
      {children}
    </motion.div>
  );
}
