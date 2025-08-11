import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { services, Service } from "@/data/services";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ServiceSelectionProps {
  onContinue: (selectedServices: Service[]) => void;
}

const ServiceSelection = ({ onContinue }: ServiceSelectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

  const featuredService = services.find(
    (s) => s.title === "End to End Services"
  );
  const otherServices = services.filter(
    (s) => s.title !== "End to End Services"
  );

  const handleServiceSelect = (service: Service) => {
    setSelectedServices((prev) => {
      if (service.title === "End to End Services") {
        return [service];
      }
      const isSelected = prev.some((s) => s.title === service.title);
      if (isSelected) {
        return prev.filter((s) => s.title !== service.title);
      } else {
        return [...prev.filter(s => s.title !== "End to End Services"), service];
      }
    });
  };

  const filteredServices = otherServices.filter(
    (service) =>
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSelected = (service: Service) => {
    return selectedServices.some((s) => s.title === service.title);
  };

  return (
    <div className="space-y-4 pb-24">
      <h1 className="text-2xl font-bold tracking-tight">
        Project Support Request
      </h1>
      <p className="text-muted-foreground">
        Select the services you need for your project. You can select
        multiple services, or choose our end-to-end package.
      </p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search support options..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {featuredService && (
        <Card
          className={cn(
            "w-full hover:bg-muted/50 transition-colors cursor-pointer",
            isSelected(featuredService) && "ring-2 ring-primary"
          )}
          onClick={() => handleServiceSelect(featuredService)}
        >
          <CardContent className="p-6 flex items-center gap-6">
            <div
              className={cn(
                "p-3 rounded-lg",
                featuredService.iconColor
              )}
            >
              <featuredService.icon className="h-8 w-8" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">
                {featuredService.title}
              </h2>
              <p className="text-muted-foreground">
                {featuredService.description}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredServices.map((service) => (
          <Card
            key={service.title}
            className={cn(
              "hover:bg-muted/50 transition-colors cursor-pointer h-full",
              isSelected(service) && "ring-2 ring-primary"
            )}
            onClick={() => handleServiceSelect(service)}
          >
            <CardContent className="p-4 flex items-start gap-4">
              <div
                className={cn("p-2 rounded-lg", service.iconColor)}
              >
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
      
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-4 border-t lg:pl-[276px]">
        <div className="max-w-6xl mx-auto flex justify-end">
          <Button
            size="lg"
            onClick={() => onContinue(selectedServices)}
            disabled={selectedServices.length === 0}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceSelection;