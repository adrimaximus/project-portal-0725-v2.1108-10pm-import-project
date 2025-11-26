import { Service } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import Icon from "@/components/Icon";

interface SelectedServicesSummaryProps {
  selectedServices: Service[];
  onContinue: () => void;
}

const SelectedServicesSummary = ({ selectedServices, onContinue }: SelectedServicesSummaryProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm md:left-[220px] lg:left-[280px] z-10">
      <div className="flex items-center justify-between gap-6 p-4">
        <div className="flex-1">
          {selectedServices.length > 0 && (
            <div>
              <h3 className="font-semibold text-base mb-2">Selected Services</h3>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-2">
                {selectedServices.map((service) => (
                  <div
                    key={service.title}
                    className="flex items-center gap-2 bg-muted p-2 rounded-lg"
                  >
                    <div
                      className={cn("p-1 rounded-md", service.icon_color)}
                    >
                      <Icon name={service.icon as any} className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">
                      {service.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          <Button onClick={onContinue} disabled={selectedServices.length === 0}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectedServicesSummary;