"use client";

import { allServices, type Service } from "@/data/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ServiceSelectionProps {
  selectedServices: Service[];
  onServiceToggle: (service: Service) => void;
}

const ServiceCard = ({
  service,
  isSelected,
  onToggle,
}: {
  service: Service;
  isSelected: boolean;
  onToggle: () => void;
}) => (
  <div
    onClick={onToggle}
    className={cn(
      "flex flex-col items-start p-4 rounded-lg border cursor-pointer transition-all",
      isSelected ? "border-primary ring-2 ring-primary" : "border-border"
    )}
  >
    <div className="flex items-center justify-between w-full">
      <div className="flex items-start gap-4">
        <service.icon className={cn("h-8 w-8", service.color)} />
        <div>
          <h3 className={cn("font-semibold", service.color)}>{service.name}</h3>
          <p className="text-sm text-muted-foreground">{service.description}</p>
        </div>
      </div>
      <Checkbox checked={isSelected} className="ml-4" />
    </div>
  </div>
);

export default function ServiceSelection({ selectedServices, onServiceToggle }: ServiceSelectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Services</CardTitle>
        <p className="text-muted-foreground">
          Choose the services you are interested in for your project.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allServices.map((service) => (
            <ServiceCard
              key={service.name}
              service={service}
              isSelected={selectedServices.some((s) => s.name === service.name)}
              onToggle={() => onServiceToggle(service)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}