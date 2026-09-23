import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface BarChartItem {
  label: string;
  value: number;
  color?: string;
  subLabel?: string;
}

export interface BarChartProps {
  data: BarChartItem[];
  height?: number;
  valueFormatter?: (value: number) => string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 180,
  valueFormatter = (val) => val.toLocaleString('es-ES'),
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="w-full">
      <div
        className="flex items-end justify-between gap-2 pt-6 pb-2"
        style={{ height: `${height}px` }}
      >
        {data.map((item, idx) => {
          const heightPercent = Math.max((item.value / maxValue) * 100, 4);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: -6 }}
                  className="absolute bottom-full z-10 mb-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-gray-900 dark:bg-slate-800 rounded-lg shadow-lg whitespace-nowrap pointer-events-none border border-gray-700/50"
                >
                  <div>{item.label}</div>
                  <div className="text-blue-300 font-mono font-bold">{valueFormatter(item.value)}</div>
                </motion.div>
              )}

              {/* Bar with spring animation */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPercent}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: idx * 0.04 }}
                className="w-full max-w-[42px] rounded-t-lg transition-opacity duration-200"
                style={{
                  backgroundColor: item.color || '#3B82F6',
                  opacity: hoveredIdx !== null && !isHovered ? 0.45 : 1,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* X Axis Labels */}
      <div className="flex justify-between gap-2 border-t border-gray-100 dark:border-slate-800 pt-2 text-[11px] text-gray-500 dark:text-slate-400">
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 text-center truncate font-medium" title={item.label}>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerTitle?: string;
  centerSubtitle?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 180,
  strokeWidth = 24,
  centerTitle,
  centerSubtitle,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const total = data.reduce((acc, cur) => acc + cur.value, 0) || 1;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* SVG Donut */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-100 dark:text-slate-800"
          />
          {data.map((item, idx) => {
            const percent = item.value / total;
            const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
            const strokeDashoffset = -circumference * accumulatedPercent;
            accumulatedPercent += percent;

            const isHovered = hoveredIdx === idx;

            return (
              <motion.circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center Labels */}
        {(centerTitle || centerSubtitle) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            {centerTitle && (
              <span className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">
                {centerTitle}
              </span>
            )}
            {centerSubtitle && (
              <span className="text-[10px] font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                {centerSubtitle}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="space-y-2 flex-1 w-full">
        {data.map((item, idx) => {
          const percent = ((item.value / total) * 100).toFixed(1);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                isHovered
                  ? 'bg-gray-100/80 dark:bg-slate-800 font-semibold'
                  : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-700 dark:text-slate-300 truncate">{item.label}</span>
              </div>
              <div className="text-right ml-2 shrink-0">
                <span className="font-bold text-gray-900 dark:text-white mr-1.5">{item.value}</span>
                <span className="text-gray-400 font-mono text-[11px]">({percent}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
