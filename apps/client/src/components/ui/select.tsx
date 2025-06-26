import React, { createContext, useContext, useState } from 'react';

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

const useSelect = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within Select');
  }
  return context;
};

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [open, setOpen] = useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className = '' }) => {
  const { setOpen, open } = useSelect();

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
    >
      {children}
      <svg
        className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
};

interface SelectValueProps {
  placeholder?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder = 'Select...' }) => {
  const { value } = useSelect();
  return <span>{value || placeholder}</span>;
};

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectContent: React.FC<SelectContentProps> = ({ children, className = '' }) => {
  const { open, setOpen } = useSelect();

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
      <div className={`absolute top-full left-0 z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto ${className}`}>
        {children}
      </div>
    </>
  );
};

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const SelectItem: React.FC<SelectItemProps> = ({ value, children, className = '' }) => {
  const { onValueChange, setOpen, value: selectedValue } = useSelect();

  const handleClick = () => {
    onValueChange?.(value);
    setOpen(false);
  };

  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
        isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
      } ${className}`}
    >
      {children}
    </button>
  );
}; 