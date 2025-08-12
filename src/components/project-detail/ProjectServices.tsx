import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProjectServicesProps {
  services: string[] | null | undefined;
}

const ProjectServices = ({ services }: ProjectServicesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Services</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {services && services.length > 0 ? (
            services.map((service: string) => (
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
      </CardContent>
    </Card>
  );
};

export default ProjectServices;