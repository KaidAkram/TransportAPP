import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

export interface GlassSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface GlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: GlassSelectOption[];
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function GlassSelect({
  value,
  onChange,
  options,
  placeholder = "Sélectionner...",
  className = "",
  error = false,
}: GlassSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between rounded-xl bg-white/5 border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-white/30 ${
          error ? "border-red-500/50" : "border-white/10 hover:bg-white/10"
        } ${isOpen ? "bg-white/10 border-white/30" : ""} ${
          selectedOption ? "text-white" : "text-white/40"
        }`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={`h-4 w-4 ms-2 text-white/50 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1.5 rounded-xl bg-purple-950/95 border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-xs text-white/40 text-center">Aucune option</div>
              ) : (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => {
                      if (!option.disabled) {
                        onChange(option.value);
                        setIsOpen(false);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-start ${
                      option.disabled
                        ? "text-white/20 cursor-not-allowed"
                        : value === option.value
                        ? "bg-white/10 text-white font-bold"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {value === option.value && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
