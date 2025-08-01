import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";

interface ProjectServicesProps {
  services: string[];
  isEditing: boolean;
  onServicesChange: (services: string[]) => void;
}

const ProjectServices = ({ services, isEditing, onServicesChange }: ProjectServicesProps) => {
  const [newService, setNewService] = useState("");

  const handleAddService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      onServicesChange([...services, newService.trim()]);
      setNewService("");
    }
  };

  const handleRemoveService = (serviceToRemove: string) => {
    onServicesChange(services.filter(s => s !== serviceToRemove));
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Services</h3>
      <div className="flex flex-wrap gap-2 items-center">
        {services && services.length > 0 ? (
          services.map((service) => (
            <Badge key={service} variant="secondary" className="text-base py-1 px-3">
              {service}
              {isEditing && (
                <button onClick={() => handleRemoveService(service)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No services selected.</p>
        )}
      </div>
      {isEditing && (
        <div className="flex space-x-2 mt-4">
          <Input
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
            placeholder="Add a service..."
            onKeyPress={(e) => e.key === 'Enter' && handleAddService()}
          />
          <Button onClick={handleAddService}>Add</Button>
        </div>
      )}
    </div>
  );
};

export default ProjectServices;