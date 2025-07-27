import { Project } from "@/data/projects";
import { Button } from "@/components/ui/button";

export interface ProjectHeaderProps {
    project: Project;
    isEditing: boolean;
    onEditToggle: () => void;
    onSave: () => void;
    onCancel: () => void;
}

const ProjectHeader = ({ project, isEditing, onEditToggle, onSave, onCancel }: ProjectHeaderProps) => {
    return (
        <div className="flex items-center justify-between rounded-lg border p-4">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <div className="flex gap-2">
                {isEditing ? (
                    <>
                        <Button variant="outline" onClick={onCancel}>Cancel</Button>
                        <Button onClick={onSave}>Save Changes</Button>
                    </>
                ) : (
                    <Button onClick={onEditToggle}>Edit Project</Button>
                )}
            </div>
        </div>
    );
}

export default ProjectHeader;