import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Icon from "@/components/Icon";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('services').select('*');
      if (error) {
        toast.error('Failed to load services.');
        console.error(error);
      } else {
        setServices(data as Service[]);
      }
      setLoading(false);
    };
    fetchServices();
  }, []);

  const featuredService = services.find((s) => s.is_featured);
  const otherServices = services.filter((s) => !s.is_featured);

  const filteredServices = otherServices.filter(
    (service) =>
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSelected = (service: Service) => {
    return selectedServices.some((s) => s.title === service.title);
  };

  if (loading) {
    return (
      <div className="space-y-4 pb-40">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-10 w-full mt-4" />
        <Skeleton className="h-40 w-full mt-4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-40">
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
                featuredService.icon_color
              )}
            >
              <Icon name={featuredService.icon as any} className="h-8 w-8" />
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
                className={cn("p-2 rounded-lg", service.icon_color)}
              >
                <Icon name={service.icon as any} className="h-6 w-6" />
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