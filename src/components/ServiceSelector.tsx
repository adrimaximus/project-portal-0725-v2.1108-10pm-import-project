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
import { Badge } from "@/components/ui/badge";
import { Service } from "@/types";

interface ServiceSelectorProps {
  services: Service[];
  selectedServices: Service[];
  onSelectionChange: (service: Service) => void;
}

const ServiceSelector = ({ services, selectedServices, onSelectionChange }: ServiceSelectorProps) => {
  const [open, setOpen] = React.useState(false);

  const handleUnselect = (e: React.MouseEvent, service: Service) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectionChange(service);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[40px]"
        >
          <div className="flex gap-1 flex-wrap">
            {selectedServices.length > 0 ? (
              selectedServices.map((service) => (
                <Badge
                  variant="secondary"
                  key={service.title}
                  className="mr-1"
                >
                  {service.title}
                  <button
                    onClick={(e) => handleUnselect(e, service)}
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground font-normal">Select services...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search for a service..." />
          <CommandList>
            <CommandEmpty>No service found.</CommandEmpty>
            <CommandGroup>
              {services.map((service) => (
                <CommandItem
                  key={service.title}
                  onSelect={() => {
                    onSelectionChange(service);
                  }}
                  value={service.title}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedServices.some((ss) => ss.title === service.title)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <span>{service.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ServiceSelector;