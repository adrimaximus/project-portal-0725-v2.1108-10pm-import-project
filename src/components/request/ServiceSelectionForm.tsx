import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Service } from "@/data/services";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceSelectionFormProps {
  services: Service[];
  selectedServices: Service[];
  onSelectionChange: (services: Service[]) => void;
}

const ServiceSelectionForm = ({
  services,
  selectedServices,
  onSelectionChange,
}: ServiceSelectionFormProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleServiceSelect = (service: Service) => {
    const isSelected = selectedServices.some((s) => s.title === service.title);
    if (isSelected) {
      onSelectionChange(selectedServices.filter((s) => s.title !== service.title));
    } else {
      onSelectionChange([...selectedServices, service]);
    }
  };

  const filteredServices = services.filter(
    (service) =>
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredServices.map((service) => (
          <Card
            key={service.title}
            className={cn(
              "hover:bg-muted/50 transition-colors cursor-pointer h-full",
              selectedServices.some((s) => s.title === service.title) && "ring-2 ring-primary"
            )}
            onClick={() => handleServiceSelect(service)}
          >
            <CardContent className="p-4 flex items-start gap-4">
              <div className={cn("p-2 rounded-lg", service.iconColor)}>
                <service.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">{service.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {service.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ServiceSelectionForm;