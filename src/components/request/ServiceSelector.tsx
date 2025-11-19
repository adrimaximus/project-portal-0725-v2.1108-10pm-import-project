import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

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
import { useServices } from "@/hooks/useServices"

interface ServiceSelectorProps {
  selectedServices: string[];
  onSelectServices: (services: string[]) => void;
}

export default function ServiceSelector({ selectedServices, onSelectServices }: ServiceSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const { data: allServices = [], isLoading } = useServices();

  const handleSelect = (serviceTitle: string) => {
    const isSelected = selectedServices.includes(serviceTitle);
    if (isSelected) {
      onSelectServices(selectedServices.filter(s => s !== serviceTitle));
    } else {
      onSelectServices([...selectedServices, serviceTitle]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">
            {selectedServices.length > 0
              ? `${selectedServices.length} service(s) selected`
              : "Select services..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search services..." />
          <CommandList>
            <CommandEmpty>{isLoading ? "Loading..." : "No service found."}</CommandEmpty>
            <CommandGroup>
              {allServices.map((service) => (
                <CommandItem
                  key={service.title}
                  value={service.title}
                  onSelect={() => handleSelect(service.title)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedServices.includes(service.title) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {service.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}