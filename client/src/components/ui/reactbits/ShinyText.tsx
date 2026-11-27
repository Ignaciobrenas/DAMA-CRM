import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  /** Seconds per sweep. */
  speed?: number;
  className?: string;
}

/** Text with a highlight that sweeps across it (React Bits "ShinyText" pattern). */
export const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 3.2,
  className = '',
}) => (
  <span
    className={`rb-shiny-text ${disabled ? '' : 'is-shining'} ${className}`}
    style={{ animationDuration: `${speed}s` }}
  >
    {text}
  </span>
);

export default ShinyText;
