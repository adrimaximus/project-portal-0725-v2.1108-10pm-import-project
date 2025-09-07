"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export type Option = {
  value: string;
  label: string;
  [key: string]: any;
};

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  onCreate?: (label: string) => Promise<Option | undefined>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MultiSelect = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  MultiSelectProps
>(({ options, value, onChange, onCreate, placeholder, className, disabled }, ref) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "") {
          const newSelected = [...value];
          newSelected.pop();
          onChange(newSelected);
        }
      }
      if (e.key === "Escape") {
        input.blur();
      }
    }
  };

  const selectedObjects = React.useMemo(() => {
    // Ensure we only show selected items that exist in the options
    const optionMap = new Map(options.map(opt => [opt.value, opt]));
    return value.map(val => optionMap.get(val)).filter(Boolean) as Option[];
  }, [options, value]);

  const filteredOptions = React.useMemo(() => {
    return options.filter(
      (option) =>
        !value.includes(option.value) &&
        option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [options, value, inputValue]);

  const handleCreate = async () => {
    if (onCreate && inputValue) {
      const newOption = await onCreate(inputValue);
      if (newOption) {
        onChange([...value, newOption.value]);
      }
      setInputValue("");
    }
  };

  const showCreateOption = onCreate && inputValue && !options.some(option => option.label.toLowerCase() === inputValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "group flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            className,
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
            {selectedObjects.map((option) => (
              <Badge
                key={option.value}
                variant="secondary"
                className="rounded-sm"
              >
                {option.label}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(option.value);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(option.value)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            ))}
            <CommandPrimitive
              onKeyDown={handleKeyDown}
              ref={ref}
              className="flex-1"
            >
              <CommandPrimitive.Input
                ref={inputRef}
                value={inputValue}
                onValueChange={setInputValue}
                onBlur={() => setOpen(false)}
                onFocus={() => setOpen(true)}
                placeholder={placeholder || "Select..."}
                className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                disabled={disabled}
              />
            </CommandPrimitive>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandList>
            {filteredOptions.length > 0 && (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onSelect={() => {
                      setInputValue("");
                      onChange([...value, option.value]);
                    }}
                    className={"cursor-pointer"}
                  >
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showCreateOption && (
              <CommandItem
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onSelect={handleCreate}
                className="cursor-pointer"
              >
                Create "{inputValue}"
              </CommandItem>
            )}
            {!showCreateOption && filteredOptions.length === 0 && (
              <div className="py-6 text-center text-sm">No results found.</div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

MultiSelect.displayName = "MultiSelect";

export { MultiSelect };