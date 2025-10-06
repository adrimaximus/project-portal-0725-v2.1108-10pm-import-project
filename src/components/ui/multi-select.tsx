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

type Option = {
  value: string;
  label: string;
};

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MultiSelect = React.forwardRef<
  HTMLDivElement,
  MultiSelectProps
>(({ options, value, onChange, placeholder, className, disabled }, ref) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const selectedOptions = React.useMemo(() => {
    return options.filter(option => value.includes(option.value));
  }, [options, value]);

  const handleUnselect = (optionValue: string) => {
    if (disabled) return;
    onChange(value.filter((v) => v !== optionValue));
  };

  const handleSelect = (optionValue: string) => {
    if (disabled) return;
    if (!value.includes(optionValue)) {
      onChange([...value, optionValue]);
    }
    setInputValue("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const input = inputRef.current;
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "") {
          const newSelected = [...selectedOptions];
          const lastSelected = newSelected.pop();
          if (lastSelected) {
            handleUnselect(lastSelected.value);
          }
        }
      }
      if (e.key === "Escape") {
        input.blur();
      }
    }
  };

  const selectableOptions = options.filter(option => !value.includes(option.value));
  const filteredOptions = selectableOptions.filter(option => 
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div ref={ref}>
      <Command onKeyDown={handleKeyDown} className={cn("overflow-visible bg-transparent", className)}>
        <div
          className={cn(
            "group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            disabled && "cursor-not-allowed opacity-50"
          )}
          onClick={() => {
            if (disabled) return;
            inputRef.current?.focus();
            if (!open) setOpen(true);
          }}
        >
          <div className="flex flex-wrap gap-1">
            {selectedOptions.map((option) => {
              return (
                <Badge key={option.value} variant="secondary">
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
              );
            })}
            <CommandPrimitive.Input
              ref={inputRef}
              value={inputValue}
              onValueChange={setInputValue}
              onBlur={() => setOpen(false)}
              onFocus={() => !disabled && setOpen(true)}
              placeholder={selectedOptions.length > 0 ? '' : placeholder}
              className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
              disabled={disabled}
            />
          </div>
        </div>
        <div className="relative mt-2">
          {open && !disabled && (
            <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
              <CommandList>
                <CommandGroup className="h-full max-h-60 overflow-auto">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onSelect={() => handleSelect(option.value)}
                        className={"cursor-pointer"}
                      >
                        {option.label}
                      </CommandItem>
                    ))
                  ) : (
                    inputValue.length > 0 && <div className="py-6 text-center text-sm">No results found.</div>
                  )}
                </CommandGroup>
              </CommandList>
            </div>
          )}
        </div>
      </Command>
    </div>
  );
});

MultiSelect.displayName = "MultiSelect";

export { MultiSelect };