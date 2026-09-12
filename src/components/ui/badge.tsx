import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  children,
  dot = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantClasses = {
    success: 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30',
    warning: 'bg-amber-950/70 text-amber-300 border border-amber-500/30',
    danger: 'bg-rose-950/70 text-rose-300 border border-rose-500/30',
    info: 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/30',
    neutral: 'bg-slate-900 text-slate-300 border border-slate-700/60',
    accent: 'bg-violet-950/70 text-violet-300 border border-violet-500/30',
  };

  const dotColors = {
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-cyan-400',
    neutral: 'bg-slate-400',
    accent: 'bg-violet-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full font-mono uppercase tracking-wider whitespace-nowrap ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
