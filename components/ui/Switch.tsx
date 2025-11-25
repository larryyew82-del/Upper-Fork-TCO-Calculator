import React from 'react';

interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export const Switch = ({ id, checked, onCheckedChange, className }: SwitchProps) => {
  const handleToggle = () => {
    onCheckedChange(!checked);
  };

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={handleToggle}
      className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 dark:focus:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-slate-900 dark:bg-slate-400' : 'bg-slate-200 dark:bg-slate-700'} ${className || ''}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
};