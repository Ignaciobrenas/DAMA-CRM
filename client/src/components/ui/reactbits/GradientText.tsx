import React from 'react';

interface GradientTextProps {
  children: React.ReactNode;
  /** Gradient stops, left to right. Defaults to lagoon -> saffron -> lagoon. */
  colors?: string[];
  /** Seconds for one full pass of the gradient. */
  animationSpeed?: number;
  className?: string;
}

const DEFAULT_COLORS = ['#0A6E87', '#F6B535', '#0A6E87'];

/** Text filled with a slowly moving gradient (React Bits "GradientText" pattern). */
export const GradientText: React.FC<GradientTextProps> = ({
  children,
  colors = DEFAULT_COLORS,
  animationSpeed = 8,
  className = '',
}) => (
  <span
    className={`rb-gradient-text ${className}`}
    style={{
      backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
      animationDuration: `${animationSpeed}s`,
    }}
  >
    {children}
  </span>
);

export default GradientText;
