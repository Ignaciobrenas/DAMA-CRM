import React, { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  formatter?: (val: number) => string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  from = 0,
  to,
  duration = 1.2,
  formatter = (val) => Math.round(val).toLocaleString(),
  className = '',
}) => {
  const [currentValue, setCurrentValue] = useState(from);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCurrentValue(from + (to - from) * easeOut);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCurrentValue(to);
      }
    };

    window.requestAnimationFrame(step);
  }, [to, from, duration]);

  return <span className={className}>{formatter(currentValue)}</span>;
};
