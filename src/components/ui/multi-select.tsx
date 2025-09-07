import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "./badge";

export type MultiSelectOption = {
  value: string;
  label: string;
};

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxListHeightClass?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  className,
  disabled,
  maxListHeightClass = "max-h-64",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selectedOptions = React.useMemo(() => {
    return options.filter((option) => value.includes(option.value));
  }, [options, value]);

  const filteredOptions = React.useMemo(() => {
    if (!query) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(query.toLowerCase())
    );
  }, [options, query]);

  function toggleSelect(optionValue: string) {
    let next: string[];
    if (value.includes(optionValue)) {
      next = value.filter((v) => v !== optionValue);
    } else {
      next = [...value, optionValue];
    }
    onChange(next);
  }

  function removeOption(optionValue: string) {
    onChange(value.filter((v) => v !== optionValue));
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={!!disabled}
          className={cn(
            "w-full justify-between gap-2 rounded-lg border-input bg-background px-3 py-2 text-left shadow-sm hover:bg-accent/40 data-[state=open]:ring-2 data-[state=open]:ring-ring",
            { "opacity-60 cursor-not-allowed": disabled },
            className
          )}
        >
          <div className="flex min-h-6 flex-1 flex-wrap items-center gap-1">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground/70">{placeholder}</span>
            ) : (
              selectedOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="group gap-1 rounded-md px-2 py-1 text-xs"
                >
                  {option.label}
                  <button
                    type="button"
                    aria-label={`Remove ${option.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption(option.value);
                    }}
                    className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <div className="flex items-center gap-1">
            {selectedOptions.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                aria-label="Clear all"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <ChevronsUpDown
              className="h-4 w-4 text-muted-foreground transition-transform duration-150 data-[state=open]:rotate-180"
              data-state={open ? "open" : "closed"}
            />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 rounded-xl border bg-popover shadow-xl"
        align="start"
        sideOffset={8}
      >
        <Command shouldFilter={false} className="flex h-full w-full flex-col overflow-hidden rounded-xl">
          <div className="p-2">
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Type to search…"
              className="rounded-lg"
            />
          </div>
          <CommandList className={`${maxListHeightClass} overflow-y-auto px-1 pb-2`}>
            <CommandEmpty>
              <div className="px-3 py-2 text-sm text-muted-foreground">No results.</div>
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((opt) => {
                const active = value.includes(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => toggleSelect(opt.value)}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="truncate">{opt.label}</span>
                    {active ? <Check className="h-4 w-4" /> : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}