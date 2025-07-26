import { useState } from "react";
import { services, Service } from "@/data/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ServiceSelectorProps {
  onNext: (selectedServices: Service[]) => void;
}

const ServiceSelector = ({ onNext }: ServiceSelectorProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelect = (title: string) => {
    setSelected(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const handleNextClick = () => {
    const selectedServices = services.filter(s => selected.includes(s.title));
    onNext(selectedServices);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">What services do you need?</h1>
      <p className="text-muted-foreground">Select all that apply. You can always add or remove services later.</p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map(service => (
          <Card 
            key={service.title} 
            onClick={() => handleSelect(service.title)}
            className={cn("cursor-pointer transition-all", selected.includes(service.title) && "border-primary ring-2 ring-primary/50")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-medium">{service.title}</CardTitle>
              <div className={cn("p-2 rounded-md", service.iconColor)}>
                <service.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{service.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleNextClick} disabled={selected.length === 0}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default ServiceSelector;