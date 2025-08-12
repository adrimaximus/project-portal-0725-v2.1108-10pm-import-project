import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getServices } from "@/api/services";
import { Service } from "@/types";

interface ServiceSelectionProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedServices: Service[];
  onServiceSelect: (service: Service) => void;
}

const ServiceSelection = ({
  searchTerm,
  onSearchTermChange,
  selectedServices,
  onServiceSelect,
}: ServiceSelectionProps) => {
  const { data: services = [], isLoading, isError } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: getServices,
  });

  const featuredService = services.find(
    (s) => s.title === "End to End Services"
  );
  const otherServices = services.filter(
    (s) => s.title !== "End to End Services"
  );

  const filteredServices = otherServices.filter(
    (service) =>
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSelected = (service: Service) => {
    return selectedServices.some((s) => s.title === service.title);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-500 bg-red-500/10 p-4 rounded-md">
        Failed to load services. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight">
        Select Services
      </h2>
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
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
      </div>

      {featuredService && (
        <Card
          className={cn(
            "w-full hover:bg-muted/50 transition-colors cursor-pointer",
            isSelected(featuredService) && "ring-2 ring-primary"
          )}
          onClick={() => onServiceSelect(featuredService)}
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
            onClick={() => onServiceSelect(service)}
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
    </div>
  );
};

export default ServiceSelection;