import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glass' | 'highlight';
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  icon: Icon,
  action,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-[#0E1524] border border-slate-800/80 shadow-lg',
    elevated: 'bg-[#121A2D] border border-slate-700/60 shadow-xl',
    glass: 'bg-[#0E1524]/80 backdrop-blur-md border border-slate-800/60',
    highlight: 'bg-[#0E1524] border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.08)]',
  };

  return (
    <div className={`rounded-xl p-5 transition-all duration-200 ${variantStyles[variant]} ${className}`} {...props}>
      {(title || Icon || action) && (
        <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="p-2 rounded-lg bg-cyan-950/40 text-cyan-400 border border-cyan-500/20 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              {title && <h3 className="text-sm font-semibold text-slate-100 tracking-wide truncate">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-400 truncate mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  sublabel?: string;
  statusColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  sublabel,
}) => {
  const changeColors = {
    positive: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
    negative: 'text-rose-400 bg-rose-950/40 border-rose-500/30',
    neutral: 'text-slate-400 bg-slate-900 border-slate-700/60',
  };

  return (
    <div className="bg-[#0E1524] border border-slate-800/80 rounded-xl p-4.5 hover:border-slate-700 transition-all duration-200 group">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider font-mono">{label}</span>
        <div className="p-2 rounded-lg bg-slate-900/80 text-cyan-400 border border-slate-800 group-hover:border-cyan-500/30 group-hover:text-cyan-300 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold text-slate-100 tracking-tight font-mono">{value}</div>
        {change && (
          <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${changeColors[changeType]}`}>
            {change}
          </span>
        )}
      </div>
      {sublabel && <p className="text-xs text-slate-500 mt-1 truncate">{sublabel}</p>}
    </div>
  );
};
