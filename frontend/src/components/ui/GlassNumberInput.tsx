import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface GlassNumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  customStep?: number;
  suffix?: string;
  error?: boolean;
}

export const GlassNumberInput = forwardRef<HTMLInputElement, GlassNumberInputProps>(
  ({ className = '', suffix, error, customStep, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Expose the internal input ref to react-hook-form
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const handleIncrement = () => {
      if (inputRef.current) {
        const stepValue = customStep !== undefined ? customStep : (props.step && props.step !== 'any' ? Number(props.step) : 1);
        const currentValue = Number(inputRef.current.value) || 0;
        const max = props.max !== undefined ? Number(props.max) : Infinity;
        inputRef.current.value = String(Math.min(currentValue + stepValue, max));
        inputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    const handleDecrement = () => {
      if (inputRef.current) {
        const stepValue = customStep !== undefined ? customStep : (props.step && props.step !== 'any' ? Number(props.step) : 1);
        const currentValue = Number(inputRef.current.value) || 0;
        const min = props.min !== undefined ? Number(props.min) : -Infinity;
        inputRef.current.value = String(Math.max(currentValue - stepValue, min));
        inputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    return (
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="number"
          className={`w-full rounded-xl bg-white/5 border px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--color-electric-violet)] focus:bg-white/10 transition-all font-mono pr-12 ${
            error ? 'border-red-500/50' : 'border-white/10'
          } ${className}`}
          {...props}
        />
        
        {/* Suffix (e.g. "km" or "DZD") */}
        {suffix && (
          <span className="absolute right-12 text-white/30 text-xs font-bold pointer-events-none">
            {suffix}
          </span>
        )}
        
        {/* Custom Spin Buttons */}
        <div className="absolute right-1.5 flex flex-col items-center justify-center h-[calc(100%-8px)] w-8 bg-black/20 rounded-lg border border-white/5 overflow-hidden">
          <button
            type="button"
            onClick={handleIncrement}
            className="text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-1 flex items-center justify-center w-full border-b border-white/5"
            tabIndex={-1}
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDecrement}
            className="text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-1 flex items-center justify-center w-full"
            tabIndex={-1}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }
);

GlassNumberInput.displayName = 'GlassNumberInput';
