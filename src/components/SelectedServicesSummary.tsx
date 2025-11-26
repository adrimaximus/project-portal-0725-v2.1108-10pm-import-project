import { Service } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { getIconComponent } from "@/data/icons";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

interface SelectedServicesSummaryProps {
  selectedServices: Service[];
  onContinue: () => void;
}

const SelectedServicesSummary = ({ selectedServices, onContinue }: SelectedServicesSummaryProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm md:left-[220px] lg:left-[280px] z-10 shadow-lg animate-in slide-in-from-bottom-10 duration-300">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-sm">Selected Services</h3>
            <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
              {selectedServices.length}
            </span>
          </div>
          
          {selectedServices.length > 0 ? (
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex space-x-3 pb-2">
                {selectedServices.map((service) => {
                  const Icon = getIconComponent(service.icon);
                  return (
                    <div
                      key={service.title}
                      className="flex items-center gap-3 bg-card border p-2 pr-3 rounded-lg shadow-sm min-w-[140px]"
                    >
                      <div
                        className={cn("p-1.5 rounded-md shrink-0", service.icon_color)}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium truncate">
                        {service.title}
                      </span>
                    </div>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" className="h-2" />
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">No services selected yet.</p>
          )}
        </div>
        
        <div className="flex-shrink-0 w-full sm:w-auto pt-2 sm:pt-0">
          <Button onClick={onContinue} disabled={selectedServices.length === 0} size="lg" className="w-full sm:w-auto shadow-md">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectedServicesSummary;