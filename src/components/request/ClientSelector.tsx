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
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Person } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { getInitials } from "@/lib/utils"

interface ClientSelectorProps {
  people: Person[];
  selectedPerson: Person | null;
  onSelectPerson: (person: Person | null) => void;
  onAddNewClient: () => void;
}

export function ClientSelector({ people, selectedPerson, onSelectPerson, onAddNewClient }: ClientSelectorProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedPerson ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={selectedPerson.avatar_url || ''} alt={selectedPerson.full_name} />
                <AvatarFallback>{getInitials(selectedPerson.full_name)}</AvatarFallback>
              </Avatar>
              <span>{selectedPerson.full_name}</span>
            </div>
          ) : (
            "Select a client..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search client..." />
          <CommandList>
            <CommandEmpty>No client found.</CommandEmpty>
            <CommandGroup>
              {people.map((person) => (
                <CommandItem
                  key={person.id}
                  value={person.full_name}
                  onSelect={() => {
                    onSelectPerson(person.id === selectedPerson?.id ? null : person)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedPerson?.id === person.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                   <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={person.avatar_url || ''} alt={person.full_name} />
                        <AvatarFallback>{getInitials(person.full_name)}</AvatarFallback>
                      </Avatar>
                      <span>{person.full_name}</span>
                    </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
                <CommandItem onSelect={() => {
                    onAddNewClient();
                    setOpen(false);
                }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span>Add New Client</span>
                </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}