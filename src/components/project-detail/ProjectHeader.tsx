import { Project, ProjectStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Loader2, MoreVertical, Trash2, CheckCircle, Link as LinkIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../StatusBadge";
import { getProjectStatusStyles, cn } from "@/lib/utils";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { toast } from "sonner";

interface ProjectHeaderProps {
  project: Project;
  isEditing: boolean;
  isSaving: boolean;
  canEdit: boolean;
  onEditToggle: () => void;
  onSaveChanges: () => void;
  onCancelChanges: () => void;
  onToggleComplete: () => void;
  onDeleteProject: () => void;
  onFieldChange: (field: keyof Project, value: any) => void;
  onStatusChange?: (newStatus: ProjectStatus) => void;
  hasOpenTasks: boolean;
  hasChanges: boolean;
}

const ProjectHeader = ({
  project,
  isEditing,
  isSaving,
  canEdit,
  onEditToggle,
  onSaveChanges,
  onCancelChanges,
  onToggleComplete,
  onDeleteProject,
  onFieldChange,
  onStatusChange,
  hasOpenTasks,
  hasChanges,
}: ProjectHeaderProps) => {
  const navigate = useNavigate();

  const statusStyles = getProjectStatusStyles(project.status);
  const isCompleted = project.status === 'Completed';

  const handleCopyLink = () => {
    const title = `*${project.name}*`;
    const url = window.location.href;
    const textToCopy = `${title}\n${url}`;
    navigator.clipboard.writeText(textToCopy);
    toast.success("Project title and link copied to clipboard!");
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground px-0 hover:bg-transparent">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Projects
      </Button>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3 min-w-0 w-full lg:w-auto">
          <div className="w-1 h-8 flex-shrink-0" style={{ backgroundColor: statusStyles.hex }} />
          {isEditing ? (
            <Input
              value={project.name || ''}
              onChange={(e) => onFieldChange('name', e.target.value)}
              className="text-3xl font-bold tracking-tight h-auto p-0 border-0 shadow-none focus-visible:ring-0 w-full"
            />
          ) : (
            <h1 className="text-3xl font-bold tracking-tight truncate">{project.name}</h1>
          )}
          {project.status && <StatusBadge status={project.status} onStatusChange={onStatusChange} hasOpenTasks={hasOpenTasks} />}
        </div>
        {canEdit && (
          <div className="flex justify-start lg:justify-end items-center gap-2 flex-shrink-0">
            {isEditing ? (
              <div className="flex gap-2">
                <Button onClick={onSaveChanges} disabled={isSaving || !hasChanges}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={onCancelChanges} disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  <LinkIcon className="h-4 w-4" />
                  <span className="sr-only">Copy link</span>
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="inline-block">
                        <Button
                          variant={isCompleted ? "default" : "outline"}
                          onClick={onToggleComplete}
                          disabled={!isCompleted && hasOpenTasks}
                          className={cn(isCompleted && "bg-green-600 hover:bg-green-700")}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {isCompleted ? "Completed" : "Mark Complete"}
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {hasOpenTasks && !isCompleted && (
                      <TooltipContent>
                        <p>Complete all tasks before marking the project as complete.</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={onEditToggle}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Project
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={onDeleteProject} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectHeader;