import { Project, User, File as ProjectFile, Service } from "@/data/projects";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { FileIcon, PlusCircle, Trash2 } from "lucide-react";

interface ProjectSidebarProps {
  project: Project;
  onUpdateBudget: (budget: string) => void;
  onAddFile: (file: ProjectFile) => void;
  onAddService: (service: Service) => void;
  onUpdateTeam: (team: User[]) => void;
  onDeleteProject: () => void;
}

export function ProjectSidebar({
  project,
  onDeleteProject,
}: ProjectSidebarProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="lg:col-span-1 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Budget</span>
            <span className="font-semibold">{formatCurrency(project.budget)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Category</span>
            <span className="font-semibold">{project.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Owner</span>
            <span className="font-semibold">{project.owner.name}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {project.assignedTo.map(user => (
            <div key={user.id} className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user.name}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Files</CardTitle>
          <Button variant="ghost" size="sm"><PlusCircle className="h-4 w-4 mr-1" /> Add</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {project.briefFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <FileIcon className="h-4 w-4" />
              <span>{file.name}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="w-full" onClick={onDeleteProject}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Project
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}