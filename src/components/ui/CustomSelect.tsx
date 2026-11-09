"use client";

import { ChevronDown, Check } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type CustomSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type CustomSelectProps = {
  id?: string;
  name?: string;
  value: string;
  options: readonly CustomSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
};

/** A keyboard-accessible, brand-styled listbox used everywhere instead of native selects. */
export function CustomSelect({
  id,
  name,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  required = false,
  invalid = false,
  className = "",
  ...aria
}: CustomSelectProps) {
  const generatedId = useId();
  const controlId = id ?? `custom-select-${generatedId}`;
  const listboxId = `${controlId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => {
    const index = options.findIndex((option) => option.value === value);
    return index >= 0 ? index : Math.max(0, options.findIndex((option) => !option.disabled));
  });

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    const selectedIndex = options.findIndex((option) => option.value === value);
    if (selectedIndex >= 0) setActiveIndex(selectedIndex);
  }, [options, value]);

  function move(step: 1 | -1) {
    let index = activeIndex;
    for (let i = 0; i < options.length; i += 1) {
      index = (index + step + options.length) % options.length;
      if (!options[index]?.disabled) {
        setActiveIndex(index);
        return;
      }
    }
  }

  function choose(option: CustomSelectOption) {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      move(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) setOpen(true);
      move(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      const index = options.findIndex((option) => !option.disabled);
      if (index >= 0) setActiveIndex(index);
    } else if (event.key === "End") {
      event.preventDefault();
      const index = [...options].findLastIndex((option) => !option.disabled);
      if (index >= 0) setActiveIndex(index);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) setOpen(true);
      else if (options[activeIndex]) choose(options[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        id={controlId}
        type="button"
        role="combobox"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onKeyDown}
        className={`input flex w-full items-center justify-between gap-3 text-left ${
          invalid ? "border-danger" : ""
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
        {...aria}
      >
        <span className={selected ? "text-ink-900" : "text-ink-400"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-ink-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {name && <input type="hidden" name={name} value={value} required={required} />}

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={aria["aria-label"]}
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-[80] max-h-64 overflow-y-auto rounded-sm border border-ink-900/15 bg-white p-1.5 shadow-xl"
        >
          {options.map((option, index) => (
            <button
              key={option.value || `empty-${index}`}
              type="button"
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(option)}
              className={`flex w-full items-center justify-between gap-3 rounded-xs px-3 py-2.5 text-left text-[0.8125rem] transition-colors ${
                option.disabled
                  ? "cursor-not-allowed text-ink-300"
                  : index === activeIndex
                    ? "bg-ink-900 text-white"
                    : "text-ink-700 hover:bg-paper-100"
              }`}
            >
              <span>{option.label}</span>
              {option.value === value && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
