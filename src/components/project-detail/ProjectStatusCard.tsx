import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project, PROJECT_STATUS_OPTIONS } from "@/types";
import { ListTodo } from "lucide-react";
import StatusBadge from "../StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProjectStatusCardProps {
  project: Project;
  isEditing: boolean;
  onFieldChange: (field: keyof Project, value: any) => void;
}

const ProjectStatusCard = ({ project, isEditing, onFieldChange }: ProjectStatusCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Status</CardTitle>
        <ListTodo className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Select
            value={project.status}
            onValueChange={(value) => onFieldChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="pt-2">
            <StatusBadge status={project.status} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectStatusCard;