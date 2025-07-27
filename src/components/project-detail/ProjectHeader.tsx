import React from 'react';
import { Project } from '@/data/projects';
import { Button } from '@/components/ui/button';
import { Trash2, Pencil, Save, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProjectHeaderProps {
  project: Project;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project, isEditing, onEdit, onSave, onCancel, onDelete }) => {
  return (
    <div className="flex items-center justify-between space-y-2">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
        <p className="text-muted-foreground">Manage project details, team, and comments.</p>
      </div>
      <div className="flex items-center space-x-2">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={onCancel}><X className="mr-2 h-4 w-4" /> Cancel</Button>
            <Button onClick={onSave}><Save className="mr-2 h-4 w-4" /> Save</Button>
          </>
        ) : (
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the project.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={onEdit}><Pencil className="mr-2 h-4 w-4" /> Edit Project</Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectHeader;