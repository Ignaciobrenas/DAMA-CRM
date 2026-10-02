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
  size = 18,
  color,
  badge,
  badgeColor = 'bg-rose-500 text-white',
  active = false,
  animateAmbient = false,
}) => {
  const getMotionVariants = (): Variants => {
    switch (variant) {
      case 'spin':
        return {
          hover: { rotate: 360, transition: { duration: 0.6, ease: 'easeInOut' } },
          tap: { scale: 0.85, rotate: 180 },
        };

      case 'pulse':
        return {
          hover: {
            scale: [1, 1.28, 1.12],
            transition: { duration: 0.45, repeat: Infinity, repeatType: 'reverse' as const },
          },
          tap: { scale: 0.88 },
        };

      case 'glow':
        return {
          hover: {
            scale: 1.18,
            filter: 'drop-shadow(0px 0px 8px rgba(59, 130, 246, 0.85)) brightness(1.2)',
            transition: { duration: 0.25 },
          },
          tap: { scale: 0.9 },
        };

      case 'tilt':
        return {
          hover: {
            rotate: [-12, 12, -6, 6, 0],
            scale: 1.15,
            transition: { duration: 0.45, ease: 'easeOut' },
          },
          tap: { scale: 0.88 },
        };

      case 'float':
        return {
          hover: {
            y: -4,
            scale: 1.12,
            transition: { duration: 0.25, ease: 'easeOut' },
          },
          tap: { y: 0, scale: 0.92 },
        };

      case 'wiggle':
        return {
          hover: {
            rotate: [0, -15, 15, -10, 10, -5, 5, 0],
            scale: 1.16,
            transition: { duration: 0.5, ease: 'easeInOut' },
          },
          tap: { scale: 0.85 },
        };

      case 'flip':
        return {
          hover: {
            rotateY: 180,
            scale: 1.12,
            transition: { duration: 0.45, ease: 'easeInOut' },
          },
          tap: { scale: 0.9 },
        };

      case 'elastic':
        return {
          hover: {
            scale: [1, 1.35, 0.92, 1.18, 1],
            transition: { duration: 0.55, ease: 'easeInOut' },
          },
          tap: { scale: 0.85 },
        };

      case 'shimmer':
        return {
          hover: {
            scale: 1.14,
            filter: [
              'brightness(1) drop-shadow(0 0 0px transparent)',
              'brightness(1.5) drop-shadow(0 0 10px rgba(234, 179, 8, 0.9))',
              'brightness(1.1) drop-shadow(0 0 4px rgba(234, 179, 8, 0.4))',
            ],
            transition: { duration: 0.5 },
          },
          tap: { scale: 0.9 },
        };

      case 'none':
        return {};

      case 'bounce':
      default:
        return {
          hover: {
            y: [0, -5, 1, -2, 0],
            scale: 1.18,
            transition: { type: 'spring', stiffness: 450, damping: 14 },
          },
          tap: { scale: 0.85 },
        };
    }
  };

  const getAmbientAnimation = () => {
    if (!animateAmbient) return undefined;
    return {
      y: [0, -3, 0],
      scale: [1, 1.06, 1],
      transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
    };
  };

  return (
    <div className="relative inline-flex items-center justify-center group/icon">
      {/* Dynamic Background Glow Halo on Hover / Active */}
      <div
        className={`absolute inset-0 rounded-full blur-xs opacity-0 transition-opacity duration-300 pointer-events-none group-hover/icon:opacity-40 ${
          active ? 'opacity-30 bg-blue-500' : 'bg-brand-primary'
        }`}
      />

      <motion.div
        variants={getMotionVariants()}
        whileHover="hover"
        whileTap="tap"
        animate={getAmbientAnimation()}
        className={`relative inline-flex items-center justify-center transition-colors transform-gpu ${
          active ? 'text-blue-600 dark:text-blue-400 font-bold' : ''
        } ${className}`}
      >
        <Icon size={size} color={color} className="shrink-0 stroke-[2.2px]" />
      </motion.div>

      {badge !== undefined && badge !== null && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          className={`absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold font-mono tracking-tight shadow-md border border-white/20 ${badgeColor}`}
        >
          {badge}
        </motion.span>
      )}
    </div>
  );
};
