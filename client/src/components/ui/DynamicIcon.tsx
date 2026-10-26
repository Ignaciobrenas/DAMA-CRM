import React from 'react';
import { motion, Variants } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export type IconAnimationVariant =
  | 'bounce'
  | 'spin'
  | 'pulse'
  | 'glow'
  | 'tilt'
  | 'float'
  | 'wiggle'
  | 'flip'
  | 'elastic'
  | 'shimmer'
  | 'none';

interface DynamicIconProps {
  icon: LucideIcon;
  variant?: IconAnimationVariant;
  className?: string;
  size?: number;
  color?: string;
  badge?: string | number;
  badgeColor?: string;
  active?: boolean;
  animateAmbient?: boolean;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({
  icon: Icon,
  variant = 'bounce',
  className = '',
  size = 17,
  color,
  badge,
  badgeColor = 'bg-rose-500 text-white',
  animateAmbient = false,
}) => {
  // Emil Kowalski subtle, disciplined spring physics (no disorienting 360 spins or 180 flips)
  const getMotionVariants = (): Variants => {
    if (variant === 'none') return {};
    return {
      hover: {
        scale: 1.06,
        transition: { type: 'spring', stiffness: 450, damping: 24 },
      },
      tap: {
        scale: 0.96,
        transition: { duration: 0.1 },
      },
    };
  };

  const getAmbientAnimation = () => {
    if (!animateAmbient) return undefined;
    return {
      y: [0, -2, 0],
      transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
    };
  };

  return (
    <span className="relative inline-flex items-center justify-center shrink-0">
      <motion.span
        variants={getMotionVariants()}
        whileHover="hover"
        whileTap="tap"
        animate={getAmbientAnimation()}
        className={`relative inline-flex items-center justify-center transition-colors duration-150 transform-gpu ${className}`}
      >
        <Icon size={size} color={color} className="shrink-0 stroke-[1.9px]" />
      </motion.span>

      {badge !== undefined && badge !== null && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          className={`absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold font-mono tracking-tight shadow-xs border border-white/20 ${badgeColor}`}
        >
          {badge}
        </motion.span>
      )}
    </span>
  );
};
