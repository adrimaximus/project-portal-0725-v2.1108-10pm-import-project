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
import { Badge } from "@/components/ui/badge";

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
      const { data, error } = await supabase.from('services').select('*').order('is_featured', { ascending: false }).order('title');
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

  const filteredServices = services.filter(
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
        multiple services.
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredServices.map((service) => (
          <Card
            key={service.title}
            className={cn(
              "hover:bg-muted/50 transition-colors cursor-pointer h-full flex flex-col",
              isSelected(service) && "ring-2 ring-primary"
            )}
            onClick={() => onServiceSelect(service)}
          >
            <CardContent className="p-4 flex flex-col items-start gap-4 flex-grow">
              <div className="flex justify-between items-start w-full">
                <div
                  className={cn("p-2 rounded-lg", service.icon_color)}
                >
                  <Icon name={service.icon as any} className="h-6 w-6" />
                </div>
                {service.is_featured && <Badge>Featured</Badge>}
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold">{service.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
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