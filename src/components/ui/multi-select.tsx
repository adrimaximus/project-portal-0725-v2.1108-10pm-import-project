import * as React from "react";
import { X, ChevronsUpDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandInput,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Option = {
  label: string;
  value: string;
  color?: string;
};

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  creatable?: boolean;
  onCreate?: (value: string) => void;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  className,
  disabled = false,
  creatable = false,
  onCreate,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const selected = value.map((val) => options.find((opt) => opt.value === val)).filter(Boolean) as Option[];

  const handleUnselect = (item: string) => {
    onChange(value.filter((i) => i !== item));
  };

  const handleSelect = (item: string) => {
    if (value.includes(item)) {
      handleUnselect(item);
    } else {
      onChange([...value, item]);
    }
  };

  const handleCreate = () => {
    if (onCreate && inputValue.trim()) {
      onCreate(inputValue.trim());
      setInputValue("");
    }
  };

  // Determine if the current input matches any existing option label
  const exactMatch = options.some((opt) => opt.label.toLowerCase() === inputValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-auto min-h-10 px-3 py-2 hover:bg-background",
            className
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 items-center w-full">
            {selected.length === 0 && (
              <span className="text-muted-foreground font-normal">{placeholder}</span>
            )}
            {selected.map((item) => (
              <Badge
                key={item.value}
                variant="secondary"
                style={item.color ? { 
                    backgroundColor: `${item.color}15`, 
                    color: item.color,
                    borderColor: `${item.color}40`
                } : undefined}
                className="mr-1 mb-1 border"
              >
                {item.label}
                <div
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(item.value);
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={() => handleUnselect(item.value)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </div>
              </Badge>
            ))}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search..." 
            value={inputValue} 
            onValueChange={setInputValue} 
          />
          <CommandList>
            <CommandEmpty>
                {creatable && inputValue.trim() && !exactMatch ? (
                    <div className="p-2">
                        <Button variant="ghost" className="w-full justify-start h-auto p-2" onClick={handleCreate}>
                            Create "{inputValue}"
                        </Button>
                    </div>
                ) : (
                    <span className="p-2 block text-center text-sm text-muted-foreground">No results found.</span>
                )}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(option.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2">
                    {option.color && (
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: option.color }} />
                    )}
                    <span>{option.label}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}