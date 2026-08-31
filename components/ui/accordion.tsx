"use client";

import { useState, useId } from "react";
import { cn } from "@/lib/utils/cn";

interface AccordionItem {
  value: string;
  trigger: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  className?: string;
  onValueChange?: (value: string | string[]) => void;
}

export function Accordion({
  items,
  type = "single",
  defaultValue,
  className,
  onValueChange,
}: AccordionProps) {
  const [value, setValue] = useState<string | string[]>(
    defaultValue ?? (type === "single" ? "" : [])
  );

  const handleChange = (itemValue: string) => {
    let newValue: string | string[];

    if (type === "single") {
      newValue = value === itemValue ? "" : itemValue;
    } else {
      const currentValues = value as string[];
      newValue = currentValues.includes(itemValue)
        ? currentValues.filter((v) => v !== itemValue)
        : [...currentValues, itemValue];
    }

    setValue(newValue);
    onValueChange?.(newValue);
  };

  const isOpen = (itemValue: string) => {
    if (type === "single") {
      return value === itemValue;
    }
    return (value as string[]).includes(itemValue);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => (
        <AccordionItemComponent
          key={item.value}
          value={item.value}
          trigger={item.trigger}
          content={item.content}
          disabled={item.disabled}
          isOpen={isOpen(item.value)}
          onChange={handleChange}
        />
      ))}
    </div>
  );
}

interface AccordionItemComponentProps {
  value: string;
  trigger: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
  isOpen: boolean;
  onChange: (value: string) => void;
}

function AccordionItemComponent({
  value,
  trigger,
  content,
  disabled,
  isOpen,
  onChange,
}: AccordionItemComponentProps) {
  const triggerId = useId();
  const contentId = useId();

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        id={triggerId}
        aria-expanded={isOpen}
        aria-controls={contentId}
        aria-disabled={disabled}
        onClick={() => !disabled && onChange(value)}
        className={cn(
          "w-full px-5 py-4 text-left flex items-center justify-between gap-4",
          "hover:bg-slate-50 transition-colors",
          "focus-visible:outline-2 focus-visible:outline-primary-600 focus-visible:outline-offset-[-2px]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="font-medium text-slate-900 flex-1">{trigger}</span>
        <ChevronDownIcon
          className={cn(
            "h-5 w-5 text-slate-500 flex-shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      <div
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isOpen ? "max-h-96 opacity-100 pb-5" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-5 border-t border-slate-100 pt-4">
          {content}
        </div>
      </div>
    </div>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5", className)}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}