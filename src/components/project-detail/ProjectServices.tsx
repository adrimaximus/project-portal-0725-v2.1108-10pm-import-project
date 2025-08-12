import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { getServices } from '@/api/services';
import ServiceSelection from '@/components/ServiceSelection';
import { Service } from '@/types';
import { Loader2 } from 'lucide-react';

interface ProjectServicesProps {
  selectedServices: string[] | null | undefined;
  isEditing: boolean;
  onServicesChange: (services: string[]) => void;
}

const ProjectServices = ({ selectedServices, isEditing, onServicesChange }: ProjectServicesProps) => {
  const { data: allServices = [], isLoading } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: getServices,
  });

  if (isEditing) {
    if (isLoading) {
      return <div className="flex justify-center items-center h-32"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }
    return (
      <ServiceSelection
        services={allServices.map(s => s.title)}
        selectedServices={selectedServices || []}
        onSelectionChange={onServicesChange}
      />
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selectedServices && selectedServices.length > 0 ? (
        selectedServices.map((service: string) => (
          <Badge key={service} variant="secondary" className="text-sm">
            {service}
          </Badge>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          No services selected for this project.
        </p>
      )}
    </div>
  );
};

export default ProjectServices;