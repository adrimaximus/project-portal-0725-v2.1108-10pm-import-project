import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FileUp } from "lucide-react";
import { addDays } from "date-fns";

interface SupportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const SupportDialog = ({ isOpen, onOpenChange }: SupportDialogProps) => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState("bug");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getTaskTitle = (type: string) => {
    switch (type) {
      case 'bug':
        return 'Bug Report';
      case 'suggestion':
        return 'Idea / Suggestion';
      default:
        return 'Support: Other';
    }
  };

  const getPlaceholder = (type: string) => {
    switch (type) {
      case 'bug':
        return "What's the bug? What did you expect?";
      case 'suggestion':
        return "What's your idea or suggestion? How would it help?";
      default:
        return "Please describe the issue.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to submit a report.");
      return;
    }
    if (!description) {
      toast.error("Please provide a description.");
      return;
    }

    setIsSubmitting(true);
    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;

    try {
      // 1. Upload attachment if it exists
      if (attachment) {
        const sanitizedFileName = attachment.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
        const filePath = `support/${user.id}/${Date.now()}-${sanitizedFileName}`;
        const { error: uploadError } = await supabase.storage
          .from('support-attachments')
          .upload(filePath, attachment);

        if (uploadError) {
          throw new Error(`Failed to upload attachment: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('support-attachments')
          .getPublicUrl(filePath);
        
        attachmentUrl = urlData.publicUrl;
        attachmentName = attachment.name;
      }

      // 2. Insert into support_tickets table
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        report_type: reportType,
        description,
        attachment_url: attachmentUrl,
      });

      if (error) throw error;

      // 3. Find 'General Tasks' project
      const { data: generalProject, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('slug', 'general-tasks')
        .single();
      
      if (projectError || !generalProject) {
        throw new Error("Could not find the 'General Tasks' project. Task cannot be created.");
      }
      const projectId = generalProject.id;

      // 4. Find assignees (BD and master admin)
      const { data: assignees, error: assigneesError } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['BD', 'master admin']);
      
      if (assigneesError) {
        console.warn("Could not find assignees for support ticket:", assigneesError.message);
      }
      const assigneeIds = assignees ? assignees.map(a => a.id) : [];

      // 5. Find or create 'support' tag
      let { data: supportTag, error: tagError } = await supabase
        .from('tags')
        .select('id')
        .eq('name', 'support')
        .single();

      if (!supportTag && (!tagError || tagError.code === 'PGRST116')) {
        const { data: newTag, error: newTagError } = await supabase
          .from('tags')
          .insert({ name: 'support', color: '#ff4d4f', user_id: user.id })
          .select('id')
          .single();
        if (newTagError) throw new Error(`Failed to create 'support' tag: ${newTagError.message}`);
        supportTag = newTag;
      } else if (tagError && tagError.code !== 'PGRST116') {
        throw new Error(`Failed to query for 'support' tag: ${tagError.message}`);
      }
      const tagId = supportTag?.id;

      // 6. Create a comment that represents the ticket
      const { data: newComment, error: commentError } = await supabase
        .from('comments')
        .insert({
          project_id: projectId,
          author_id: user.id,
          text: description,
          is_ticket: true,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
        })
        .select('id')
        .single();

      if (commentError || !newComment) {
        throw new Error(`Failed to create a comment for the ticket: ${commentError?.message}`);
      }
      const commentId = newComment.id;

      // 7. Create the task
      const dueDate = addDays(new Date(), 7).toISOString();
      const { data: newTask, error: taskError } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          created_by: user.id,
          title: getTaskTitle(reportType),
          description: description,
          status: 'To do',
          priority: 'Normal',
          due_date: dueDate,
          origin_ticket_id: commentId,
        })
        .select('id')
        .single();

      if (taskError || !newTask) {
        throw new Error(`Failed to create the task: ${taskError?.message}`);
      }
      const taskId = newTask.id;

      // 8. Assign the task
      if (assigneeIds.length > 0) {
        const assignments = assigneeIds.map(userId => ({ task_id: taskId, user_id: userId }));
        const { error: assignmentError } = await supabase.from('task_assignees').insert(assignments);
        if (assignmentError) console.warn("Failed to assign task:", assignmentError.message);
      }

      // 9. Tag the task
      if (tagId) {
        const { error: taskTagError } = await supabase.from('task_tags').insert({ task_id: taskId, tag_id: tagId });
        if (taskTagError) console.warn("Failed to tag task:", taskTagError.message);
      }

      toast.success("Your report has been sent and a task has been created. Thank you!");
      onOpenChange(false);
      setDescription("");
      setAttachment(null);
    } catch (error: any) {
      toast.error("Failed to submit your report.", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Let us know what's going on. We'll get back to you as soon as possible.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                defaultValue={user.name}
                className="col-span-3"
                disabled
              />
            </div>
            <input type="hidden" name="email" value={user.email} />
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reportType" className="text-right">
                Type
              </Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="suggestion">Idea / Suggestion</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder={getPlaceholder(reportType)}
                className="col-span-3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="attachment" className="text-right">
                Attachment
              </Label>
              <div className="col-span-3">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <FileUp className="mr-2 h-4 w-4" />
                  {attachment ? "Change file" : "Upload screenshot"}
                </Button>
                <Input
                  id="attachment"
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => setAttachment(e.target.files ? e.target.files[0] : null)}
                />
                {attachment && (
                    <p className="text-xs text-muted-foreground mt-2 truncate">
                        {attachment.name}
                    </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};