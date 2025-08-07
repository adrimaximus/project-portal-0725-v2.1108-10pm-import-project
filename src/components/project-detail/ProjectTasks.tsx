"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { PlusCircle } from "lucide-react";

import { Project, Task, User } from "@/data/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskCard } from "./TaskCard";
import { MultiSelect } from "../ui/multi-select";

interface ProjectTasksProps {
  project: Project;
  tasks: Task[];
  onTaskCreate: (taskTitle: string) => void;
  onTaskUpdate: (taskId: string, updatedTask: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskOrderChange: (taskIds: string[]) => void;
  onAssignUserToTask: (taskId: string, users: User[]) => void;
}

export function ProjectTasks({
  project,
  tasks,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onTaskOrderChange,
  onAssignUserToTask,
}: ProjectTasksProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      const newTasks = Array.from(tasks);
      const [removed] = newTasks.splice(oldIndex, 1);
      newTasks.splice(newIndex, 0, removed);
      onTaskOrderChange(newTasks.map((t) => t.id));
    }
  };

  const handleCreateTask = () => {
    if (newTaskTitle.trim()) {
      onTaskCreate(newTaskTitle.trim());
      setNewTaskTitle("");
    }
  };

  const handleUpdateTask = (taskId: string) => {
    if (editingTaskTitle.trim()) {
      onTaskUpdate(taskId, { title: editingTaskTitle.trim() });
      setEditingTaskId(null);
      setEditingTaskTitle("");
    }
  };

  const handleAssignUserToTask = (taskId: string, users: User[]) => {
    onAssignUserToTask(taskId, users);
  };

  const userOptions = useMemo(
    () =>
      project.assignedTo.map((user) => ({
        value: user.id,
        label: user.name,
      })),
    [project.assignedTo]
  );

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Tasks</h3>
      <div className="flex gap-2">
        <Input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add a new task"
          onKeyPress={(e) => e.key === "Enter" && handleCreateTask()}
        />
        <Button onClick={handleCreateTask}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={tasks} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isEditing={editingTaskId === task.id}
                editingTaskTitle={editingTaskTitle}
                onEditStart={(id, title) => {
                  setEditingTaskId(id);
                  setEditingTaskTitle(title);
                }}
                onEditCancel={() => setEditingTaskId(null)}
                onEditTitleChange={setEditingTaskTitle}
                onUpdate={handleUpdateTask}
                onDelete={onTaskDelete}
                assigneeComponent={
                  <MultiSelect
                    options={userOptions}
                    defaultValue={(task.assignedTo || []).map((u) => u.id)}
                    onValueChange={(selectedIds) => {
                      const selectedUsers = project.assignedTo.filter((u) =>
                        selectedIds.includes(u.id)
                      );
                      handleAssignUserToTask(task.id, selectedUsers);
                    }}
                    placeholder="Assign user..."
                  />
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}