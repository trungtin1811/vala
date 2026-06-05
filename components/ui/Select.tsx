"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  label,
  error,
  id,
  className,
  disabled = false,
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#1F2937]">
          {label}
        </label>
      )}
      <SelectPrimitive.Root
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          id={id}
          disabled={disabled}
          className={cn(
            "w-full h-[42px] px-3 border border-[#E5E7EB] rounded-xl text-sm text-[#1F2937] bg-white",
            "inline-flex items-center justify-between gap-2",
            "focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20",
            "transition-colors duration-200",
            "disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] disabled:cursor-not-allowed",
            error && "border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]/20",
            className,
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon className="text-[#9CA3AF]">
            <ChevronDown size={16} />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            className="z-[1200] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-lg"
          >
            <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1 text-[#6B7280]">
              <ChevronUp size={14} />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className="max-h-72 overflow-y-auto p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className="relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm text-[#1F2937] outline-none hover:bg-[#F3F4F6] data-[highlighted]:bg-[#EFF6FF] data-[highlighted]:text-[#0052CC]"
                >
                  <span className="absolute left-2 inline-flex h-4 w-4 items-center justify-center text-[#0052CC]">
                    <SelectPrimitive.ItemIndicator>
                      <Check size={14} />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1 text-[#6B7280]">
              <ChevronDown size={14} />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && <p className="text-xs text-[#EF4444]">{error}</p>}
    </div>
  );
}
