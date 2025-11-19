"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface GroupSelectProps {
  value: string;
  onChange: (value: string) => void;
  groups: string[];
}

export function GroupSelect({ value, onChange, groups }: GroupSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const handleSelect = (currentValue: string) => {
    onChange(currentValue)
    setOpen(false)
  }

  const handleCreate = () => {
    if (search) {
      onChange(search);
      setOpen(false);
    }
  }

  const displayedValue = groups.find(g => g.toLowerCase() === value?.toLowerCase()) || value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between capitalize"
        >
          {displayedValue || "Select group..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command filter={(value, search) => value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0}>
          <CommandInput 
            placeholder="Search or create group..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              <div className="p-1">
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleCreate}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create "{search}"
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {groups.map((group) => (
                <CommandItem
                  key={group}
                  value={group}
                  onSelect={() => handleSelect(group)}
                  className="capitalize"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.toLowerCase() === group.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {group}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}