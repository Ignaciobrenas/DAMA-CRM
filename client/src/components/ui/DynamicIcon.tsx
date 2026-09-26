import React from 'react';
import { motion, Variants } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export type IconAnimationVariant = 'bounce' | 'spin' | 'pulse' | 'glow' | 'tilt' | 'float' | 'none';

interface DynamicIconProps {
  icon: LucideIcon;
  variant?: IconAnimationVariant;
  className?: string;
  size?: number;
  color?: string;
  badge?: string | number;
  badgeColor?: string;
  active?: boolean;
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
            scale: [1, 1.25, 1.1],
            transition: { duration: 0.4, repeat: Infinity, repeatType: 'reverse' as const },
          },
          tap: { scale: 0.9 },
        };
      case 'glow':
        return {
          hover: {
            scale: 1.15,
            filter: 'drop-shadow(0px 0px 6px rgba(59, 130, 246, 0.7))',
            transition: { duration: 0.3 },
          },
          tap: { scale: 0.95 },
        };
      case 'tilt':
        return {
          hover: {
            rotate: [-10, 10, -5, 5, 0],
            scale: 1.12,
            transition: { duration: 0.4 },
          },
          tap: { scale: 0.9 },
        };
      case 'float':
        return {
          hover: {
            y: -3,
            scale: 1.1,
            transition: { duration: 0.25, ease: 'easeOut' },
          },
          tap: { y: 0, scale: 0.95 },
        };
      case 'none':
        return {};
      case 'bounce':
      default:
        return {
          hover: {
            y: [0, -3, 0],
            scale: 1.14,
            transition: { duration: 0.35, ease: 'easeInOut' },
          },
          tap: { scale: 0.88 },
        };
    }
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <motion.div
        variants={getMotionVariants()}
        whileHover="hover"
        whileTap="tap"
        className={`inline-flex items-center justify-center transition-colors ${
          active ? 'text-blue-600 dark:text-blue-400' : ''
        } ${className}`}
      >
        <Icon size={size} color={color} className="shrink-0" />
      </motion.div>

      {badge !== undefined && badge !== null && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[9px] font-bold font-mono tracking-tight shadow-xs ${badgeColor}`}
        >
          {badge}
        </motion.span>
      )}
    </div>
  );
};
