import { allServices as services, Service } from "@/data/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ServiceSelectionProps {
  selectedServices: Service[];
  onServiceToggle: (service: Service) => void;
}

const ServiceSelection = ({ selectedServices, onServiceToggle }: ServiceSelectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Services</CardTitle>
        <p className="text-sm text-muted-foreground">Choose the services you are interested in.</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className={cn(
                "flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:border-primary transition-all",
                selectedServices.some(s => s.id === service.id) && "border-primary ring-2 ring-primary ring-offset-2"
              )}
              onClick={() => onServiceToggle(service)}
            >
              <service.icon className={cn("h-8 w-8", service.iconColor)} />
              <p className="text-sm font-medium leading-none">{service.title}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceSelection;