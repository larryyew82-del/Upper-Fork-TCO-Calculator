import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, FC } from 'react';
import { ChevronDownIcon } from '../icons';

interface SelectContextType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedValue: string | null;
  setSelectedValue: React.Dispatch<React.SetStateAction<string | null>>;
  selectedLabel: ReactNode | null;
  setSelectedLabel: React.Dispatch<React.SetStateAction<ReactNode | null>>;
  onValueChange?: (value: string) => void;
}

const SelectContext = createContext<SelectContextType | null>(null);

const useOnClickOutside = (ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent | TouchEvent) => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
};

export const Select = ({ value, onValueChange, children }: { value: string, onValueChange: (value: string) => void, children?: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(value);
  const [selectedLabel, setSelectedLabel] = useState<ReactNode | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(selectRef, () => setIsOpen(false));
  
  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  useEffect(() => {
    const childrenArray = React.Children.toArray(children);
    const content = childrenArray.find((child) => React.isValidElement(child) && child.type === SelectContent);

    if (React.isValidElement<{ children?: ReactNode }>(content)) {
        const items = React.Children.toArray(content.props.children);
        const selectedItem = items.find(item => React.isValidElement<{ value: string }>(item) && item.props.value === value);
        if (React.isValidElement<{ children?: ReactNode }>(selectedItem)) {
            setSelectedLabel(selectedItem.props.children);
        }
    }
  }, [value, children]);

  return (
    <SelectContext.Provider value={{ isOpen, setIsOpen, selectedValue, setSelectedValue, selectedLabel, setSelectedLabel, onValueChange }}>
      <div className="relative" ref={selectRef}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger = ({ children, className }: { children?: ReactNode, className?: string }) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error("SelectTrigger must be used within a Select");
  const { setIsOpen } = context;

  return (
    <button
      onClick={() => setIsOpen(prev => !prev)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
    >
      {children}
      <ChevronDownIcon className="h-4 w-4 opacity-50" />
    </button>
  );
};

export const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error("SelectValue must be used within a Select");
  const { selectedLabel } = context;
  return <>{selectedLabel || placeholder}</>;
};

export const SelectContent = ({ children, className }: { children?: ReactNode, className?: string }) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error("SelectContent must be used within a Select");
  const { isOpen } = context;

  if (!isOpen) return null;

  return (
    <div className={`absolute z-50 mt-1 w-full rounded-md border bg-white text-slate-900 shadow-md dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 animate-in fade-in-0 zoom-in-95 ${className || ''}`}>
      <div className="p-1">{children}</div>
    </div>
  );
};

export const SelectItem: FC<{ value: string, children?: ReactNode, className?: string }> = ({ value, children, className }) => {
  const context = useContext(SelectContext);
  if (!context) throw new Error("SelectItem must be used within a Select");
  const { setIsOpen, setSelectedValue, setSelectedLabel, onValueChange } = context;

  const handleSelect = () => {
    setSelectedValue(value);
    setSelectedLabel(children);
    if (onValueChange) onValueChange(value);
    setIsOpen(false);
  };

  return (
    <div
      onClick={handleSelect}
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className || ''}`}
    >
      {children}
    </div>
  );
};