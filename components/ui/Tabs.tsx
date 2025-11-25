import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

export const Tabs = ({ defaultValue, children, className }: { defaultValue: string, children?: ReactNode, className?: string }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className }: { children?: ReactNode, className?: string }) => {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 p-1 text-slate-500 dark:text-slate-400 ${className || ''}`}>
      {children}
    </div>
  );
};

export const TabsTrigger = ({ value, children, className }: { value: string, children?: ReactNode, className?: string }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within a Tabs component');

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${isActive ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-50 shadow-sm' : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'} ${className || ''}`}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, className }: { value: string, children?: ReactNode, className?: string }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within a Tabs component');

  const { activeTab } = context;
  const isActive = activeTab === value;

  return isActive ? <div className={`mt-2 ${className || ''}`}>{children}</div> : null;
};