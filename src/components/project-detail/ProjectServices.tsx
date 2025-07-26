import { Project } from "@/data/projects";
import { services, Service } from "@/data/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProjectServicesProps {
  project: Project;
}

const ProjectServices = ({ project }: ProjectServicesProps) => {
  const projectServices: Service[] = project.services
    .map(serviceTitle => services.find(s => s.title === serviceTitle))
    .filter((s): s is Service => s !== undefined);

  if (projectServices.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selected Services</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {projectServices.map((service) => (
          <div key={service.title} className="flex items-center gap-2 bg-muted py-1 px-2 rounded-md">
            <div className={cn("p-1 rounded-sm", service.iconColor)}>
              <service.icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">{service.title}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ProjectServices;