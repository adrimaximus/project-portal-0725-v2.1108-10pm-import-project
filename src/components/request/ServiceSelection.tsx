import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Inbox } from "lucide-react";
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
    <div className="space-y-6 pb-40">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Project Support Request
        </h1>
        <p className="text-muted-foreground text-lg">
          Select the services you need for your project to get started.
        </p>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search support options..."
          className="pl-10 h-12 text-base"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
      </div>

      {filteredServices.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredServices.map((service) => {
            const Icon = getIconComponent(service.icon);
            const selected = isSelected(service);
            
            return (
              <Card
                key={service.id}
                className={cn(
                  "cursor-pointer h-full flex flex-col border transition-all duration-200",
                  selected 
                    ? "bg-primary/5 border-primary shadow-[0_0_0_1px_hsl(var(--primary))] shadow-primary/20" 
                    : "hover:border-primary/50 hover:shadow-sm"
                )}
                onClick={() => onServiceSelect(service)}
              >
                <CardContent className="p-5 flex flex-col items-start gap-4 flex-grow">
                  <div className="flex justify-between items-start w-full">
                    <div
                      className={cn("p-2.5 rounded-xl transition-colors", service.icon_color)}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    {service.is_featured && (
                      <Badge variant="secondary" className="font-medium">Featured</Badge>
                    )}
                  </div>
                  <div className="flex-grow space-y-2">
                    <h3 className={cn("font-semibold text-lg leading-tight", selected && "text-primary")}>{service.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/30">
          <div className="bg-muted/50 p-4 rounded-full mb-4">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No services found</h3>
          <p className="text-muted-foreground max-w-sm mt-2">
            We couldn't find any services matching "{searchTerm}". Try searching for something else.
          </p>
        </div>
      )}
    </div>
  );
};

export default ServiceSelection;