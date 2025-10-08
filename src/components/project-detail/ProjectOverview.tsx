import { Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export interface ProjectOverviewProps {
  project: Project;
  isEditing: boolean;
  onFieldChange: (field: keyof Project, value: any) => void;
}

const ProjectOverview = ({ project, isEditing, onFieldChange }: ProjectOverviewProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="description" className="text-sm font-medium">Description</label>
          {isEditing ? (
            <Textarea
              id="description"
              value={project.description || ''}
              onChange={(e) => onFieldChange('description', e.target.value)}
              className="mt-1"
              rows={5}
            />
          ) : (
            <p className="text-sm text-muted-foreground mt-1">{project.description || 'No description provided.'}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="text-sm font-medium">Start Date</label>
            {isEditing ? (
              <Input
                id="start_date"
                type="date"
                value={project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : ''}
                onChange={(e) => onFieldChange('start_date', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-muted-foreground mt-1">{project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}</p>
            )}
          </div>
          <div>
            <label htmlFor="due_date" className="text-sm font-medium">Due Date</label>
            {isEditing ? (
              <Input
                id="due_date"
                type="date"
                value={project.due_date ? new Date(project.due_date).toISOString().split('T')[0] : ''}
                onChange={(e) => onFieldChange('due_date', e.target.value)}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-muted-foreground mt-1">{project.due_date ? new Date(project.due_date).toLocaleDateString() : 'Not set'}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectOverview;