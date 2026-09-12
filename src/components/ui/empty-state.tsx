import React from 'react';
import { LucideIcon, FolderOpen } from 'lucide-react';
import { Button } from './button.tsx';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = FolderOpen,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-10 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center text-center bg-[#090E17]/50 ${className}`}
    >
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 mb-4">
        <Icon className="w-6 h-6 text-cyan-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-200 tracking-wide">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mt-1 mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
