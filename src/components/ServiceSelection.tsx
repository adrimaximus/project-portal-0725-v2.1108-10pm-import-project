"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ServiceSelectionProps {
  services: string[];
  selectedServices: string[];
  onSelectionChange: (selected: string[]) => void;
}

const ServiceSelection = ({ services, selectedServices, onSelectionChange }: ServiceSelectionProps) => {

  const handleCheckedChange = (service: string, checked: boolean | "indeterminate") => {
    let newSelection: string[];
    if (checked) {
      newSelection = [...selectedServices, service];
    } else {
      newSelection = selectedServices.filter(s => s !== service);
    }
    onSelectionChange(newSelection);
  };

  return (
    <ScrollArea className="h-32">
        <div className="space-y-2 pr-4">
        {services.map((service) => (
            <div key={service} className="flex items-center space-x-2">
            <Checkbox
                id={service}
                checked={selectedServices.includes(service)}
                onCheckedChange={(checked) => handleCheckedChange(service, checked)}
            />
            <Label htmlFor={service} className="text-sm font-normal w-full truncate">
                {service}
            </Label>
            </div>
        ))}
        </div>
    </ScrollArea>
  );
};

export default ServiceSelection;