import { services, Service } from "@/data/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ServiceSelectorProps {
  selectedServices: Service[];
  onServiceToggle: (service: Service) => void;
}

const ServiceSelector = ({ selectedServices, onServiceToggle }: ServiceSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Services</CardTitle>
        <CardDescription>Choose the services you need for your project.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div
            key={service.title}
            className={cn(
              "p-4 rounded-lg border cursor-pointer transition-all",
              selectedServices.some(s => s.title === service.title) ? "border-primary ring-2 ring-primary" : "hover:border-primary/50"
            )}
            onClick={() => onServiceToggle(service)}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <service.icon className={cn("h-6 w-6", service.iconColor)} />
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold">{service.title}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </div>
              <div className="flex-shrink-0">
                <Checkbox
                  checked={selectedServices.some(s => s.title === service.title)}
                  disabled
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ServiceSelector;