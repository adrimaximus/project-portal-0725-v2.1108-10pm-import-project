import { Project } from "@/data/projects";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProjectReviewForm from "./ProjectReviewForm";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProjectOverviewTabProps {
  project: Project;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-base font-semibold mb-3">{title}</h3>
    <div className="text-sm">{children}</div>
  </div>
);

const ProjectOverviewTab = ({ project }: ProjectOverviewTabProps) => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <Section title="Project Owner">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={project.createdBy.avatar} alt={project.createdBy.name} />
              <AvatarFallback>{project.createdBy.initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{project.createdBy.name}</p>
              <p className="text-xs text-muted-foreground">{project.createdBy.email}</p>
            </div>
          </div>
        </Section>
        <Button size="sm">Done</Button>
      </div>

      <Section title="Description">
        <p className="text-muted-foreground leading-relaxed">{project.description || "No description provided."}</p>
      </Section>

      <Section title="Assigned Team">
        <div className="flex items-center -space-x-2">
          {project.assignedTo.map(user => (
            <TooltipProvider key={user.id} delayDuration={100}>
              <Tooltip>
                <TooltipTrigger>
                  <Avatar className="border-2 border-background">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.initials}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{user.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full w-10 h-10 bg-background ml-2 z-10">
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add team member</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Section>

      <Section title="Services">
        {project.services && project.services.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {project.services.map(service => (
              <span key={service} className="text-muted-foreground">{service}</span>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No services selected.</p>
        )}
      </Section>

      <Section title="Attachments">
        {project.files && project.files.length > 0 ? (
          <div className="space-y-2">
            {project.files.map((file, index) => (
              <div key={index} className="text-muted-foreground">{file.name}</div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No files attached.</p>
        )}
      </Section>

      <ProjectReviewForm />
    </div>
  );
};

export default ProjectOverviewTab;