import React from 'react';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Any CSS color, e.g. "rgba(246, 181, 53, 0.14)". Defaults to the theme glow. */
  spotlightColor?: string;
}

/**
 * Card with a cursor-follow radial glow (React Bits "SpotlightCard" pattern).
 * The glow position is driven by the delegated listener in spotlight-pointer.ts.
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  spotlightColor,
  className = '',
  style,
  children,
  ...rest
}) => (
  <div
    className={`spotlight-card ${className}`}
    style={spotlightColor ? ({ ...style, ['--spot-color' as string]: spotlightColor } as React.CSSProperties) : style}
    {...rest}
  >
    {children}
  </div>
);

export default SpotlightCard;
