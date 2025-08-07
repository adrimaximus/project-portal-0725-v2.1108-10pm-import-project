import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Edit, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Task } from "@/data/projects";

interface TaskCardProps {
  task: Task;
  isEditing: boolean;
  editingTaskTitle: string;
  onEditStart: (id: string, title: string) => void;
  onEditCancel: () => void;
  onEditTitleChange: (title: string) => void;
  onUpdate: (id: string) => void;
  onDelete: (id: string) => void;
  assigneeComponent: React.ReactNode;
}

export function TaskCard({
  task,
  isEditing,
  editingTaskTitle,
  onEditStart,
  onEditCancel,
  onEditTitleChange,
  onUpdate,
  onDelete,
  assigneeComponent,
}: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4 flex items-center gap-4">
      <div {...attributes} {...listeners} className="cursor-grab touch-none">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-grow">
        {isEditing ? (
          <Input
            value={editingTaskTitle}
            onChange={(e) => onEditTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onUpdate(task.id);
              if (e.key === "Escape") onEditCancel();
            }}
            autoFocus
          />
        ) : (
          <p className="font-medium">{task.title}</p>
        )}
      </div>
      <div className="w-48">{assigneeComponent}</div>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onUpdate(task.id)}
            >
              <Check className="h-4 w-4 text-green-500" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onEditCancel}>
              <X className="h-4 w-4 text-red-500" />
            </Button>
          </>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEditStart(task.id, task.title)}
          >
            <Edit className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
        <Button size="icon" variant="ghost" onClick={() => onDelete(task.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );
}