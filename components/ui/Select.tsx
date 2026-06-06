"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp, Search } from "lucide-react";
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
  searchable?: boolean;
  searchPlaceholder?: string;
}

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d");
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
  searchable = false,
  searchPlaceholder = "Tìm kiếm...",
}: SelectProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const filteredOptions = searchable
    ? options.filter((option) =>
        normalizeSearchValue(option.label).includes(
          normalizeSearchValue(searchQuery.trim()),
        ),
      )
    : options;

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
        onOpenChange={(open) => {
          if (!open) setSearchQuery("");
        }}
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
            {searchable && (
              <div className="flex items-center gap-2 border-b border-[#E5E7EB] px-3 py-2">
                <Search size={14} className="shrink-0 text-[#9CA3AF]" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => event.stopPropagation()}
                  placeholder={searchPlaceholder}
                  autoFocus
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#1F2937] outline-none placeholder:text-[#9CA3AF]"
                />
              </div>
            )}
            <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1 text-[#6B7280]">
              <ChevronUp size={14} />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className="max-h-72 overflow-y-auto p-1">
              {filteredOptions.map((option) => (
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
              {filteredOptions.length === 0 && (
                <p className="px-3 py-2 text-sm text-[#9CA3AF]">
                  Không tìm thấy kết quả
                </p>
              )}
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
