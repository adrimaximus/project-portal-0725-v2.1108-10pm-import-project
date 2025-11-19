import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle, Building } from "lucide-react"

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
import { Person, Company } from "@/types"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { getInitials } from "@/lib/utils"

interface ClientSelectorProps {
  people: Person[];
  companies: Company[];
  selectedClient: { type: 'person' | 'company', data: Person | Company } | null;
  onSelectClient: (client: { type: 'person' | 'company', data: Person | Company } | null) => void;
  onAddNewClient: (name: string) => void;
}

export function ClientSelector({ people, companies, selectedClient, onSelectClient, onAddNewClient }: ClientSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const sortedCompanies = React.useMemo(() => [...companies].sort((a, b) => a.name.localeCompare(b.name)), [companies]);
  const sortedPeople = React.useMemo(() => [...people].sort((a, b) => a.full_name.localeCompare(b.full_name)), [people]);

  const handleSelect = (type: 'person' | 'company', item: Person | Company) => {
    if (selectedClient?.data.id === item.id && selectedClient?.type === type) {
      onSelectClient(null);
    } else {
      onSelectClient({ type, data: item });
    }
    setOpen(false);
  };

  const selectedName = selectedClient ? (selectedClient.type === 'person' ? (selectedClient.data as Person).full_name : (selectedClient.data as Company).name) : "Select a client...";
  const selectedAvatar = selectedClient 
    ? (selectedClient.type === 'person' 
        ? (selectedClient.data as Person).avatar_url 
        : (selectedClient.data as Company).logo_url || (selectedClient.data as Company).custom_properties?.logo_image) 
    : '';
  const selectedInitials = selectedClient ? (selectedClient.type === 'person' ? getInitials((selectedClient.data as Person).full_name) : getInitials((selectedClient.data as Company).name)) : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedClient ? (
            <div className="flex items-center gap-2">
              {selectedClient.type === 'person' ? (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedAvatar || ''} alt={selectedName} />
                  <AvatarFallback>{selectedInitials}</AvatarFallback>
                </Avatar>
              ) : (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedAvatar || ''} alt={selectedName} />
                  <AvatarFallback><Building className="h-4 w-4" /></AvatarFallback>
                </Avatar>
              )}
              <span>{selectedName}</span>
            </div>
          ) : (
            "Select a client..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search client..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => onAddNewClient(search)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create "{search}"
              </Button>
            </CommandEmpty>
            
            {sortedCompanies.length > 0 && (
              <CommandGroup heading="Companies">
                {sortedCompanies.map((company) => (
                  <CommandItem
                    key={company.id}
                    value={company.name}
                    onSelect={() => handleSelect('company', company)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedClient?.data.id === company.id && selectedClient.type === 'company' ? "opacity-100" : "opacity-0"
                      )}
                    />
                     <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={company.logo_url || company.custom_properties?.logo_image || ''} alt={company.name} />
                          <AvatarFallback><Building className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <span>{company.name}</span>
                      </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {sortedPeople.length > 0 && (
              <CommandGroup heading="People">
                {sortedPeople.map((person) => (
                  <CommandItem
                    key={person.id}
                    value={person.full_name}
                    onSelect={() => handleSelect('person', person)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedClient?.data.id === person.id && selectedClient.type === 'person' ? "opacity-100" : "opacity-0"
                      )}
                    />
                     <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={person.avatar_url || ''} alt={person.full_name} />
                          <AvatarFallback>{getInitials(person.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span>{person.full_name}</span>
                          {person.company && <span className="text-xs text-muted-foreground">{person.company}</span>}
                        </div>
                      </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandSeparator />
            <CommandGroup>
                <CommandItem onSelect={() => {
                    onAddNewClient(search);
                    setOpen(false);
                }}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span>Add New Person</span>
                </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}