import React from 'react';

export const Separator = ({ className }: { className?: string }) => {
  return <div className={`shrink-0 bg-slate-200 dark:bg-slate-700 h-[1px] w-full ${className || ''}`} />;
};