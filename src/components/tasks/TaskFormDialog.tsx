import { useState, useEffect } from "react";
import { Project, Task, User, Tag, Attachment } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { DatePicker } from "@/components/ui/date-picker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { File as FileIcon, X, Paperclip, UploadCloud } from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface TaskFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  taskToEdit?: Task | null;
  onSave: (taskData: any) => Promise<void>;
  users: User[];
}

export const TaskFormDialog = ({
  isOpen,
  onOpenChange,
  project,
  taskToEdit,
  onSave,
  users,
}: TaskFormDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("To do");
  const [priority, setPriority] = useState("normal");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase.from('tags').select('*');
      if (error) {
        console.error("Error fetching tags:", error);
      } else {
        setAllTags(data || []);
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || "");
      setDescription(taskToEdit.description || "");
      setStatus(taskToEdit.status || "To do");
      setPriority(taskToEdit.priority || "normal");
      setAssigneeIds((taskToEdit.assignees || []).map((u) => u.id));
      setTagIds((taskToEdit.tags || []).map((t) => t.id));
      setDueDate(taskToEdit.due_date ? new Date(taskToEdit.due_date) : undefined);
      setAttachments(taskToEdit.attachments || []);
      setFilesToUpload([]);
    } else {
      setTitle("");
      setDescription("");
      setStatus("To do");
      setPriority("normal");
      setAssigneeIds([]);
      setTagIds([]);
      setDueDate(undefined);
      setAttachments([]);
      setFilesToUpload([]);
    }
  }, [taskToEdit, isOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFilesToUpload(prev => [...prev, ...Array.from(event.target.files!)]);
    }
  };

  const removeFileToUpload = (index: number) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteAttachment = async (attachment: Attachment) => {
    if (!confirm("Are you sure you want to delete this attachment?")) return;

    const { error: storageError } = await supabase.storage.from('project-files').remove([attachment.storage_path]);

    if (storageError && storageError.message !== 'The resource was not found') {
        toast.error(`Failed to delete from storage: ${storageError.message}`);
        return;
    }

    const { error: dbError } = await supabase.from('task_attachments').delete().eq('id', attachment.id);

    if (dbError) {
        toast.error(`Failed to delete attachment record: ${dbError.message}`);
        return;
    }

    setAttachments(prev => prev.filter(a => a.id !== attachment.id));
    toast.success("Attachment deleted.");
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setIsSubmitting(true);
    
    const taskData = {
      id: taskToEdit?.id,
      project_id: project.id,
      title,
      description,
      status,
      priority,
      due_date: dueDate ? dueDate.toISOString() : null,
      assigneeIds,
      tagIds,
      completed: status === 'Done',
      filesToUpload,
    };

    try {
      await onSave(taskData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const userOptions = users.map((user) => ({ value: user.id, label: user.name }));
  const tagOptions = allTags.map((tag) => ({ value: tag.id, label: tag.name }));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{taskToEdit ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Form fields */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="To do">To do</SelectItem>
                  <SelectItem value="In progress">In progress</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Assignees</Label>
            <MultiSelect options={userOptions} value={assigneeIds} onChange={setAssigneeIds} placeholder="Select team members..." />
          </div>
          <div>
            <Label>Tags</Label>
            <MultiSelect options={tagOptions} value={tagIds} onChange={setTagIds} placeholder="Select or create tags..." />
          </div>
          <div>
            <Label>Due Date</Label>
            <DatePicker date={dueDate} setDate={setDueDate} />
          </div>
          
          {/* Attachments Section */}
          <div>
            <Label>Attachments</Label>
            <div className="space-y-2 mt-1">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="h-4 w-4 flex-shrink-0" />
                    <a href={attachment.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium truncate hover:underline">
                      {attachment.file_name}
                    </a>
                    <span className="text-xs text-muted-foreground">{formatBytes(attachment.file_size || 0)}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteAttachment(attachment)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {filesToUpload.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 border border-dashed rounded-md">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFileToUpload(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center w-full mt-2">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Drag 'n' drop files here, or click to select</p>
                </div>
                <input type="file" className="hidden" multiple onChange={handleFileChange} />
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : (taskToEdit ? "Save Changes" : "Create Task")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};