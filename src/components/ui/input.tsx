import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon: Icon, action, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
            {label}
            {props.required && <span className="text-cyan-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute left-3 text-slate-500 pointer-events-none">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <input
            ref={ref}
            className={`w-full bg-[#090E17] border ${
              error ? 'border-rose-500/80 focus:ring-rose-500' : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/20'
            } rounded-lg ${
              Icon ? 'pl-9' : 'pl-3.5'
            } ${action ? 'pr-10' : 'pr-3.5'} py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all font-sans ${className}`}
            {...props}
          />
          {action && <div className="absolute right-2.5 flex items-center">{action}</div>}
        </div>
        {error && <p className="text-xs text-rose-400 mt-1 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-500 mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string | number; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
            {label}
            {props.required && <span className="text-cyan-400 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full bg-[#090E17] border ${
            error ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/20'
          } rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 transition-all font-sans ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#090E17] text-slate-200">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-rose-400 mt-1 font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-500 mt-1">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
