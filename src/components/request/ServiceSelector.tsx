import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Service } from "@/data/services";

interface ServiceSelectorProps {
  services: Service[];
  selectedServices: Service[];
  onSelectionChange: (services: Service[]) => void;
}

export function ServiceSelector({ services, selectedServices, onSelectionChange }: ServiceSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (service: Service) => {
    const isSelected = selectedServices.some((s) => s.id === service.id);
    if (isSelected) {
      onSelectionChange(selectedServices.filter((s) => s.id !== service.id));
    } else {
      onSelectionChange([...selectedServices, service]);
    }
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedServices.length > 0
              ? `${selectedServices.length} service(s) selected`
              : "Select services..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search services..." />
            <CommandEmpty>No service found.</CommandEmpty>
            <CommandGroup>
              {services.map((service) => (
                <CommandItem
                  key={service.id}
                  value={service.name}
                  onSelect={() => handleSelect(service)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedServices.some((s) => s.id === service.id)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {service.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="flex flex-wrap gap-1">
        {selectedServices.map((service) => (
          <Badge key={service.id} variant="secondary">
            {service.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}