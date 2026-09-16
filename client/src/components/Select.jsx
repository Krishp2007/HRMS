import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const Select = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  label,
  icon: Icon,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-black text-slate-900 mb-1">
          {label}
        </label>
      )}

      {/* Select Trigger Box */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-blue-200 bg-sky-50/70 px-3.5 py-2.5 text-xs font-black text-slate-900 shadow-sm hover:border-blue-400 hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon className="h-4 w-4 text-blue-600 shrink-0" />}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-700 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
      </button>

      {/* Custom Styled Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-60 overflow-y-auto rounded-2xl border border-blue-200 bg-white p-1.5 shadow-xl shadow-blue-500/10 scrollbar-thin">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs font-bold text-slate-400 text-center">No options available</div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-black transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-800 hover:bg-sky-50 hover:text-blue-700'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-white" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Select;
