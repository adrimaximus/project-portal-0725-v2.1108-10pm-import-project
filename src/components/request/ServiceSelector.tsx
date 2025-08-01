import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Service } from "@/data/services";
import { cn } from "@/lib/utils";

interface ServiceSelectorProps {
  services: Service[];
  onNext: (selectedServices: Service[]) => void;
}

const ServiceSelector = ({ services, onNext }: ServiceSelectorProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelection = (title: string) => {
    setSelected((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title]
    );
  };

  const handleNext = () => {
    const selectedServices = services.filter((service) =>
      selected.includes(service.title)
    );
    onNext(selectedServices);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Services</CardTitle>
        <CardDescription>Choose the services you need for your project. You can select multiple.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.title}
              onClick={() => toggleSelection(service.title)}
              className={cn(
                "p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                selected.includes(service.title) ? "ring-2 ring-primary bg-muted/50" : "bg-background"
              )}
            >
              <div className="flex items-center gap-4 mb-2">
                <service.icon className={cn("h-6 w-6", service.iconColor)} />
                <h3 className="font-semibold">{service.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{service.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleNext} disabled={selected.length === 0}>
          Next
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ServiceSelector;