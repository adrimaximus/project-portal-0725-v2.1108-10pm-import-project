import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Service } from "@/types";
import { Badge } from "@/components/ui/badge";
import { getIconComponent } from "@/data/icons";

interface ServiceSelectionProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedServices: Service[];
  onServiceSelect: (service: Service) => void;
  preSelectIds?: string | null; // Comma separated IDs
}

const ServiceSelection = ({
  searchTerm,
  onSearchTermChange,
  selectedServices,
  onServiceSelect,
  preSelectIds
}: ServiceSelectionProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const preSelectProcessed = useRef(false);

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

  // Handle pre-selection from URL param (IDs)
  useEffect(() => {
    if (!loading && services.length > 0 && preSelectIds && !preSelectProcessed.current && selectedServices.length === 0) {
      const idsToSelect = preSelectIds.split(',').map(id => id.trim());
      
      // Filter valid services
      const servicesToSelect = services.filter(s => idsToSelect.includes(s.id));
      
      // Apply them one by one to trigger the logic in parent or bulk set if possible.
      // Since parent `onServiceSelect` toggles, we need to be careful.
      // Ideally, the parent `RequestPage` should set initial state, but since we fetch here,
      // we'll just trigger clicks for now or call onServiceSelect for each.
      
      // However, calling onServiceSelect multiple times in a row might race state updates in parent.
      // Better strategy: Iterate and call.
      
      servicesToSelect.forEach(service => {
         onServiceSelect(service);
      });

      preSelectProcessed.current = true;
    }
  }, [loading, services, preSelectIds, selectedServices.length, onServiceSelect]);

  const filteredServices = services.filter(
    (service) =>
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSelected = (service: Service) => {
    return selectedServices.some((s) => s.id === service.id);
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
        Select the services you need for your project.
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
        {filteredServices.map((service) => {
          const Icon = getIconComponent(service.icon);
          const selected = isSelected(service);
          
          return (
            <Card
              key={service.id}
              className={cn(
                "hover:bg-muted/50 transition-all cursor-pointer h-full flex flex-col border",
                selected ? "bg-primary/5 border-primary shadow-[0_0_0_1px_hsl(var(--primary))]" : "hover:border-primary/50"
              )}
              onClick={() => onServiceSelect(service)}
            >
              <CardContent className="p-4 flex flex-col items-start gap-4 flex-grow">
                <div className="flex justify-between items-start w-full">
                  <div
                    className={cn("p-2 rounded-lg transition-colors", service.icon_color)}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  {service.is_featured && <Badge variant="secondary">Featured</Badge>}
                </div>
                <div className="flex-grow">
                  <h3 className={cn("font-semibold", selected && "text-primary")}>{service.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {service.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceSelection;