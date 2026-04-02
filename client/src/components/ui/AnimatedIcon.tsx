import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export type IconAnimationVariant = 'hover-scale' | 'pulse' | 'shake' | 'bounce' | 'spin' | 'float';

interface AnimatedIconProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  animation?: IconAnimationVariant;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

const variants: Record<IconAnimationVariant, HTMLMotionProps<'div'>> = {
  'hover-scale': {
    whileHover: { scale: 1.18, rotate: 3 },
    whileTap: { scale: 0.92 },
    transition: { type: 'spring' as const, stiffness: 400, damping: 17 },
  },
  pulse: {
    animate: {
      scale: [1, 1.08, 1],
      opacity: [0.9, 1, 0.9],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
  shake: {
    animate: {
      rotate: [0, -14, 14, -10, 10, -5, 5, 0],
    },
    transition: {
      duration: 1.2,
      repeat: Infinity,
      repeatDelay: 3,
      ease: 'easeInOut',
    },
  },
  bounce: {
    whileHover: {
      y: [-2, -6, 0],
      transition: { duration: 0.35, repeat: Infinity, repeatType: 'reverse' as const },
    },
    whileTap: { scale: 0.9 },
  },
  spin: {
    animate: { rotate: 360 },
    transition: { duration: 2, repeat: Infinity, ease: 'linear' },
  },
  float: {
    animate: {
      y: [-2, 2, -2],
    },
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  children,
  animation = 'hover-scale',
  size = 'md',
  className = '',
  ...props
}) => {
  const selectedVariant = variants[animation] || variants['hover-scale'];

  return (
    <motion.div
      className={`inline-flex items-center justify-center shrink-0 ${sizeClasses[size]} ${className}`}
      {...selectedVariant}
      {...props}
    >
      {children}
    </motion.div>
  );
};
