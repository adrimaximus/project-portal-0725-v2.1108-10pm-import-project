import { Badge } from "@/components/ui/badge";
import { allServices } from "@/data/services";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ProjectServicesProps {
  selectedServices: string[];
  isEditing: boolean;
  onServicesChange: (services: string[]) => void;
}

const ProjectServices = ({ selectedServices, isEditing, onServicesChange }: ProjectServicesProps) => {
  const handleServiceToggle = (service: string) => {
    const newServices = selectedServices.includes(service)
      ? selectedServices.filter(s => s !== service)
      : [...selectedServices, service];
    onServicesChange(newServices);
  };

  if (isEditing) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {allServices.map(service => (
          <div key={service} className="flex items-center space-x-2">
            <Checkbox
              id={`service-${service}`}
              checked={selectedServices.includes(service)}
              onCheckedChange={() => handleServiceToggle(service)}
            />
            <Label htmlFor={`service-${service}`} className="font-normal cursor-pointer">
              {service}
            </Label>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selectedServices && selectedServices.length > 0 ? (
        selectedServices.map(service => (
          <Badge key={service} variant="secondary">{service}</Badge>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">No services selected.</p>
      )}
    </div>
  );
};

export default ProjectServices;