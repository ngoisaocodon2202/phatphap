"use client";
import { useState, useRef, useEffect, ReactNode } from "react";

export interface ZenSelectOption {
  value: string;
  label: string;
  shortLabel?: string;
  icon?: ReactNode;
  desc?: string;
}

interface ZenSelectProps {
  value: string;
  options: ZenSelectOption[];
  onChange: (value: string) => void;
  className?: string;
}

export function ZenSelect({
  value,
  options,
  onChange,
  className = "",
}: ZenSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block whitespace-nowrap ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-1.5 px-1 sm:px-2.5 py-0.5 sm:py-1 text-[10.5px] sm:text-xs text-[#F7EBD5] hover:text-[#F6D58A] hover:bg-white/5 active:scale-95 transition-all rounded-full focus:outline-none select-none group whitespace-nowrap min-w-0"
      >
        {selectedOption.icon && (
          <span className="hidden xs:flex sm:flex text-[#D9A441] items-center shrink-0">
            {selectedOption.icon}
          </span>
        )}
        <span className="sm:hidden font-medium tracking-tight truncate max-w-[54px] whitespace-nowrap">
          {selectedOption.shortLabel || selectedOption.label}
        </span>
        <span className="hidden sm:inline font-medium tracking-wide truncate max-w-[155px] whitespace-nowrap">
          {selectedOption.label}
        </span>
        <svg
          viewBox="0 0 16 16"
          className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#D9A441] transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="
          absolute right-0 top-full mt-2 z-50 w-[235px] max-w-[calc(100vw-24px)]
          bg-[#1B0D09]/95 backdrop-blur-2xl border border-[#D9A441]/45
          rounded-2xl p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.85)] space-y-1
          animate-in fade-in-0 zoom-in-95 duration-150 origin-top-right whitespace-nowrap
        ">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs text-left transition-all group whitespace-nowrap ${
                  isSelected
                    ? "bg-[#D9A441]/20 border border-[#D9A441]/50 text-[#F6D58A] font-medium shadow-sm"
                    : "text-[#F7EBD5]/85 hover:text-[#F6D58A] hover:bg-white/5 active:scale-[0.98]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                  {opt.icon && (
                    <span className="text-[#D9A441] shrink-0 flex items-center">
                      {opt.icon}
                    </span>
                  )}
                  <div className="min-w-0 overflow-hidden">
                    <div className="truncate font-medium whitespace-nowrap">
                      {opt.label}
                    </div>
                    {opt.desc && (
                      <div className="text-[10px] text-[#F7EBD5]/45 group-hover:text-[#F6D58A]/70 transition-colors truncate whitespace-nowrap">
                        {opt.desc}
                      </div>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <svg
                    viewBox="0 0 16 16"
                    className="w-3.5 h-3.5 text-[#F6D58A] shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <path
                      d="M3.5 8.5l3 3 6-6.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
