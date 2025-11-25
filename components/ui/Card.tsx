import React from 'react';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 ${className || ''}`}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`${className || ''}`} {...props} />
  )
);
CardContent.displayName = 'CardContent';