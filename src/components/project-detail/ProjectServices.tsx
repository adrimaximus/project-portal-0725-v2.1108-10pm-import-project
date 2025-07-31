import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { services as allServices, Service } from "@/data/services";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

interface ProjectServicesProps {
  selectedServices: string[];
  isEditing: boolean;
  onServicesChange: (services: string[]) => void;
}

const ProjectServices = ({ selectedServices, isEditing, onServicesChange }: ProjectServicesProps) => {
  const [open, setOpen] = useState(false);

  const serviceDetails = selectedServices
    .map((serviceName) => allServices.find((s) => s.title === serviceName))
    .filter((s): s is Service => s !== undefined);

  const handleSelect = (serviceTitle: string) => {
    const isSelected = selectedServices.includes(serviceTitle);
    if (isSelected) {
      onServicesChange(selectedServices.filter(s => s !== serviceTitle));
    } else {
      onServicesChange([...selectedServices, serviceTitle]);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex flex-wrap gap-2">
        {serviceDetails.length > 0 ? serviceDetails.map((service) => (
          <Badge
            key={service.title}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <service.icon className={cn("h-4 w-4", service.iconColor)} />
            <span>{service.title}</span>
          </Badge>
        )) : <p>No services selected.</p>}
      </div>
    );
  }

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
            {selectedServices.length > 0 ? `${selectedServices.length} service(s) selected` : "Select services..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search services..." />
          <CommandList>
            <CommandEmpty>No services found.</CommandEmpty>
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
                  <service.icon className={cn("mr-2 h-4 w-4", service.iconColor)} />
                  {service.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ProjectServices;