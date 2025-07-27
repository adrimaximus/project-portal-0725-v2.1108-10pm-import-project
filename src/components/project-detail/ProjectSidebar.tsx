import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Project } from "@/data/projects";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar, Wallet, Briefcase, Edit } from "lucide-react";

interface ProjectSidebarProps {
  project: Project;
}

const ProjectSidebar = ({ project }: ProjectSidebarProps) => {
  const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Details</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-start gap-4">
            <Calendar className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">Timeline</p>
              <p className="text-muted-foreground">
                {format(new Date(project.startDate), "dd MMM yyyy")} - {format(new Date(project.deadline), "dd MMM yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Wallet className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">Budget</p>
              <p className="text-muted-foreground">
                {formatCurrency(project.budget)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Briefcase className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">Services</p>
              <p className="text-muted-foreground">
                {project.services.join(", ")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Assigned Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {project.assignedTo.map((user) => (
              <div key={user.name} className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <span className={cn("absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full", user.status === 'Online' ? 'bg-green-500' : 'bg-gray-400')} />
                </div>
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.role}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectSidebar;