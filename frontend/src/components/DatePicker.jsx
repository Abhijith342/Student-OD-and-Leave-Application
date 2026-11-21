import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEK_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// Convert YYYY-MM-DD -> DD/MM/YYYY
function toDisplayFormat(isoStr) {
  if (!isoStr) return '';
  const parts = String(isoStr).split('T')[0].split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }
  return isoStr;
}

// Convert DD/MM/YYYY -> YYYY-MM-DD
function toIsoFormat(displayStr) {
  if (!displayStr) return '';
  const parts = displayStr.trim().split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (
      !isNaN(day) && !isNaN(month) && !isNaN(year) &&
      year >= 1900 && year <= 2100 &&
      month >= 1 && month <= 12 &&
      day >= 1 && day <= 31
    ) {
      const d = new Date(year, month - 1, day);
      if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }
  return null;
}

export default function DatePicker({
  value = '',
  onChange,
  name,
  id,
  min,
  max,
  required = false,
  disabled = false,
  placeholder = 'DD/MM/YYYY',
  className = '',
  containerClassName = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(toDisplayFormat(value));
  
  // Current calendar viewing month and year
  const initialDate = value ? new Date(value) : new Date();
  const validInitial = isNaN(initialDate.getTime()) ? new Date() : initialDate;
  const [viewYear, setViewYear] = useState(validInitial.getFullYear());
  const [viewMonth, setViewMonth] = useState(validInitial.getMonth()); // 0-indexed

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync internal display when external value changes
  useEffect(() => {
    setInputValue(toDisplayFormat(value));
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Handle outside click to close calendar
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Emit change to parent
  const emitChange = (isoValue) => {
    if (onChange) {
      // Support both event-like shape and raw value shape
      const event = {
        target: {
          name: name || '',
          value: isoValue || ''
        }
      };
      onChange(event);
      // Also handle direct value call if onChange is not expecting an event
      if (typeof onChange === 'function' && onChange.length === 1 && !name) {
        // e.g. onChange(val)
      }
    }
  };

  // Handle typing inside text input
  const handleInputChange = (e) => {
    let val = e.target.value;
    
    // Auto-formatting slashes as user types numbers
    const clean = val.replace(/[^\d/]/g, '');
    let formatted = clean;
    if (clean.length === 2 && !clean.includes('/') && inputValue.length < clean.length) {
      formatted = clean + '/';
    } else if (clean.length === 5 && clean.split('/').length === 2 && inputValue.length < clean.length) {
      formatted = clean + '/';
    }

    setInputValue(formatted);

    // If matches full DD/MM/YYYY
    if (formatted.length === 10) {
      const iso = toIsoFormat(formatted);
      if (iso) {
        emitChange(iso);
        const d = new Date(iso);
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    } else if (formatted === '') {
      emitChange('');
    }
  };

  const handleInputBlur = () => {
    if (!inputValue) {
      emitChange('');
      return;
    }
    const iso = toIsoFormat(inputValue);
    if (iso) {
      setInputValue(toDisplayFormat(iso));
      emitChange(iso);
    } else {
      // Revert to current valid value if invalid
      setInputValue(toDisplayFormat(value));
    }
  };

  // Selecting a day from calendar
  const handleSelectDay = (day) => {
    const selectedIso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Check min/max
    if (min && selectedIso < min) return;
    if (max && selectedIso > max) return;

    setInputValue(toDisplayFormat(selectedIso));
    emitChange(selectedIso);
    setIsOpen(false);
  };

  // Quick Today button
  const handleToday = () => {
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    if (min && todayIso < min) return;
    if (max && todayIso > max) return;

    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setInputValue(toDisplayFormat(todayIso));
    emitChange(todayIso);
    setIsOpen(false);
  };

  // Clear date
  const handleClear = (e) => {
    e.stopPropagation();
    setInputValue('');
    emitChange('');
    if (inputRef.current) inputRef.current.focus();
  };

  // Month navigation
  const prevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // Build calendar matrix (Monday as day 0)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  
  // Selected day breakdown
  let selectedYear = null;
  let selectedMonth = null;
  let selectedDay = null;
  if (value) {
    const parts = value.split('-');
    if (parts.length === 3) {
      selectedYear = parseInt(parts[0], 10);
      selectedMonth = parseInt(parts[1], 10) - 1;
      selectedDay = parseInt(parts[2], 10);
    }
  }

  // Today breakdown
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  // Year options for quick select (10 years back to 5 years forward)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear - 5; y <= currentYear + 5; y++) {
    yearOptions.push(y);
  }

  return (
    <div className={`relative inline-block w-full ${containerClassName}`} ref={containerRef}>
      {/* Visual Input Field */}
      <div 
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        className="relative flex items-center cursor-pointer group"
      >
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          maxLength={10}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled && !isOpen) setIsOpen(true);
          }}
          className={`w-full pr-16 font-mono text-xs sm:text-sm tracking-wide ${className || 'p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none'}`}
        />

        {/* Action Buttons inside Input */}
        <div className="absolute right-2.5 flex items-center space-x-1">
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) setIsOpen(prev => !prev);
            }}
            className="p-1 text-slate-400 group-hover:text-blue-600 transition-colors"
            title="Open calendar"
          >
            <CalendarIcon className="w-4 h-4 text-blue-500" />
          </button>
        </div>
      </div>

      {/* Popover Calendar Modal */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 mt-1.5 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 text-slate-800 animate-in fade-in zoom-in-95 duration-100 select-none">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Month & Year Jump Selectors */}
            <div className="flex items-center space-x-1">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent font-bold text-xs text-slate-800 py-1 px-1.5 rounded-lg hover:bg-slate-100 outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent font-bold text-xs text-slate-800 py-1 px-1.5 rounded-lg hover:bg-slate-100 outline-none cursor-pointer"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels (Mo - Su) */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEK_DAYS.map(day => (
              <span key={day} className="text-[11px] font-bold text-slate-400 py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateIso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              
              const isSelected = selectedYear === viewYear && selectedMonth === viewMonth && selectedDay === day;
              const isToday = todayYear === viewYear && todayMonth === viewMonth && todayDay === day;
              
              const isDisabled = (min && dateIso < min) || (max && dateIso > max);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectDay(day);
                  }}
                  className={`h-8 w-8 mx-auto flex items-center justify-center text-xs font-semibold rounded-xl transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : isToday
                      ? 'border border-blue-600 text-blue-600 font-bold hover:bg-blue-50'
                      : isDisabled
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Bottom Bar: Format Hint + Today Quick Button */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              Format: DD/MM/YYYY
            </span>

            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
