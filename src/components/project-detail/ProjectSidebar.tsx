import { Project } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const getStatusBadgeVariant = (status: Project["status"]) => {
  switch (status) {
    case "Completed":
      return "default";
    case "Billed":
    case "Pending":
      return "outline";
    case "In Progress":
      return "secondary";
    case "On Hold":
      return "destructive";
    default:
      return "outline";
  }
};

interface ProjectSidebarProps {
  project: Project;
}

export default function ProjectSidebar({ project }: ProjectSidebarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About Project</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-2">Status</h4>
          <Badge variant={getStatusBadgeVariant(project.status)}>
            {project.status}
          </Badge>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2">Assigned To</h4>
          <div className="space-y-2">
            {project.assignedTo.length > 0 ? (
              project.assignedTo.map((user) => (
                <div key={user.name} className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{user.name}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Unassigned</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}