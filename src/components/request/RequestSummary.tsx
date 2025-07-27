import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Service } from "@/data/services";
import { Project } from "@/data/projects";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RequestSummaryProps {
  selectedServices: Service[];
  projectDetails: Partial<Project>;
  onBack: () => void;
}

const SummaryItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between items-start">
    <p className="text-muted-foreground">{label}</p>
    <div className="text-right font-medium">{value}</div>
  </div>
);

const RequestSummary = ({ selectedServices, projectDetails }: RequestSummaryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Summary</CardTitle>
        <CardDescription>
          Please review the details of your project request before submitting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Project Details</h3>
          <div className="space-y-2 text-sm">
            <SummaryItem label="Project Name" value={projectDetails.name || "Not provided"} />
            <SummaryItem label="Description" value={<p className="max-w-xs truncate">{projectDetails.description || "Not provided"}</p>} />
            <SummaryItem label="Start Date" value={projectDetails.startDate ? format(new Date(projectDetails.startDate), "PPP") : "Not set"} />
            <SummaryItem label="Deadline" value={projectDetails.deadline ? format(new Date(projectDetails.deadline), "PPP") : "Not set"} />
            <SummaryItem
              label="Assigned Team"
              value={
                projectDetails.assignedTo && projectDetails.assignedTo.length > 0 ? (
                  <div className="flex justify-end -space-x-2">
                    {projectDetails.assignedTo.map(user => (
                      <Avatar key={user.id} className="h-6 w-6 border-2 border-card">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.slice(0,1)}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                ) : "None"
              }
            />
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="font-semibold">Selected Services</h3>
          {selectedServices.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedServices.map(service => (
                <Badge key={service.title} variant="secondary">{service.title}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No services selected.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestSummary;