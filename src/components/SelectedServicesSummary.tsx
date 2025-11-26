import { Service } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { getIconComponent } from "@/data/icons";
import { ArrowRight } from "lucide-react";

interface SelectedServicesSummaryProps {
  selectedServices: Service[];
  onContinue: () => void;
}

const SelectedServicesSummary = ({ selectedServices, onContinue }: SelectedServicesSummaryProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm md:left-[220px] lg:left-[280px] z-10 transition-all duration-300">
      <div className="flex items-center justify-between gap-6 p-4 max-w-7xl mx-auto">
        <div className="flex-1 overflow-hidden">
          {selectedServices.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h3 className="font-semibold text-sm whitespace-nowrap text-muted-foreground hidden sm:block">
                {selectedServices.length} Selected:
              </h3>
              <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto pr-2 scrollbar-hide">
                {selectedServices.map((service) => {
                  const Icon = getIconComponent(service.icon);
                  return (
                    <div
                      key={service.id}
                      className="flex items-center gap-2 bg-secondary/50 border border-border px-3 py-1.5 rounded-full animate-in fade-in slide-in-from-bottom-1 duration-200"
                    >
                      <div
                        className={cn("flex items-center justify-center", service.icon_color)}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-medium truncate max-w-[150px]">
                        {service.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          <Button onClick={onContinue} disabled={selectedServices.length === 0} size="lg" className="shadow-md">
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectedServicesSummary;