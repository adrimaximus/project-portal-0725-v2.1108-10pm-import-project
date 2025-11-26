import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Service } from "@/types";
import { Badge } from "@/components/ui/badge";
import { getIconComponent } from "@/data/icons";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ServiceSelectionProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedServices: Service[];
  onServiceSelect: (service: Service) => void;
  preSelectId?: string | null;
}

const ServiceSelection = ({
  searchTerm,
  onSearchTermChange,
  selectedServices,
  onServiceSelect,
  preSelectId
}: ServiceSelectionProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasHandledPreSelect, setHasHandledPreSelect] = useState(false);

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

  // Handle pre-selection from URL param
  useEffect(() => {
    if (!loading && services.length > 0 && preSelectId && !hasHandledPreSelect && selectedServices.length === 0) {
      const keywords = {
        'web': ['web', 'website', 'development'],
        'mobile': ['mobile', 'app', 'ios', 'android'],
        'design': ['design', 'ui', 'ux', 'creative'],
        'seo': ['seo', 'search', 'optimization'],
        'consulting': ['consult', 'advice', 'strategy'],
        'maintenance': ['maintenance', 'support'],
      };

      const targetKeywords = keywords[preSelectId as keyof typeof keywords] || [preSelectId];
      
      const matchedService = services.find(s => 
        targetKeywords.some(k => s.title.toLowerCase().includes(k))
      );

      if (matchedService) {
        onServiceSelect(matchedService);
      }
      setHasHandledPreSelect(true);
    }
  }, [loading, services, preSelectId, hasHandledPreSelect, selectedServices.length, onServiceSelect]);

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
        <div className="flex space-x-4 overflow-hidden mt-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 w-40 shrink-0 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-40">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Project Support Request
        </h1>
        <p className="text-muted-foreground">
          Select the services you need. Choosing "End-to-End" solutions effectively covers all bases.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search support options..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Available Services</h3>
          <span className="text-xs text-muted-foreground">{filteredServices.length} options</span>
        </div>
        
        <ScrollArea className="w-full whitespace-nowrap rounded-xl border bg-card/50 p-1">
          <div className="flex w-max space-x-3 p-3">
            {filteredServices.map((service) => {
              const Icon = getIconComponent(service.icon);
              const selected = isSelected(service);
              return (
                <button
                  key={service.title}
                  onClick={() => onServiceSelect(service)}
                  className={cn(
                    "relative flex flex-col items-start justify-between p-4 h-36 w-40 shrink-0 rounded-xl border transition-all duration-300 hover:shadow-md group text-left",
                    selected 
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" 
                      : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
                  )}
                >
                  <div className={cn(
                    "p-2.5 rounded-lg transition-colors", 
                    selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div className="w-full">
                    <h3 className={cn("font-medium text-sm leading-tight whitespace-normal", selected ? "text-primary" : "text-foreground")}>
                      {service.title}
                    </h3>
                  </div>

                  {service.is_featured && (
                    <span className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-yellow-500" title="Featured" />
                  )}
                  
                  {selected && (
                    <div className="absolute top-3 right-3 animate-in zoom-in duration-200">
                      <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Selected Services Summary */}
      {selectedServices.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 pt-2">
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            Selected Services <Badge variant="secondary" className="rounded-full px-2 h-5 min-w-[1.25rem]">{selectedServices.length}</Badge>
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedServices.map((service) => (
              <Badge 
                key={service.title} 
                variant="outline" 
                className="pl-2 pr-1 py-1.5 gap-1.5 text-sm bg-background hover:bg-accent transition-colors cursor-pointer border-dashed border-primary/30"
                onClick={() => onServiceSelect(service)}
              >
                {service.title}
                <div className="h-4 w-4 rounded-full hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors">
                  <X className="h-3 w-3" />
                </div>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceSelection;