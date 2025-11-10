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
import { FileUp, X, Paperclip } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

interface SupportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const SupportDialog = ({ isOpen, onOpenChange }: SupportDialogProps) => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState("bug");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (fileToRemove: File) => {
    setAttachments(prev => prev.filter(file => file !== fileToRemove));
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
    let attachmentsJsonb: any[] = [];

    try {
      // 1. Upload attachments if they exist
      if (attachments.length > 0) {
        const uploadPromises = attachments.map(async (file) => {
          const fileId = uuidv4();
          const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
          const filePath = `support-tickets/${user.id}/${Date.now()}-${sanitizedFileName}`;
          const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
          if (uploadError) throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
          
          const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
          if (!urlData || !urlData.publicUrl) throw new Error(`Failed to get public URL for ${file.name}.`);
          
          return { id: fileId, file_name: file.name, file_url: urlData.publicUrl, file_type: file.type, file_size: file.size, storage_path: filePath, created_at: new Date().toISOString() };
        });
        attachmentsJsonb = await Promise.all(uploadPromises);
      }

      // 2. Insert into support_tickets table (for logging/backup)
      const { error: ticketError } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        report_type: reportType,
        description,
        attachment_url: attachmentsJsonb.length > 0 ? attachmentsJsonb[0].file_url : null,
      });
      if (ticketError) throw ticketError;

      // 3. Ensure 'Support Tasks' project exists and get its ID
      const { data: projectId, error: projectError } = await supabase.rpc('ensure_support_project');
      if (projectError || !projectId) {
        throw new Error(`Could not access the 'Support Tasks' project. Task cannot be created. ${projectError?.message || ''}`);
      }

      // 4. Create a comment that represents the ticket, which will trigger task creation
      const { data: newComment, error: commentError } = await supabase
        .from('comments')
        .insert({
          project_id: projectId,
          author_id: user.id,
          text: description,
          is_ticket: true,
          attachments_jsonb: attachmentsJsonb,
        })
        .select('id')
        .single();

      if (commentError || !newComment) {
        throw new Error(`Failed to create a comment for the ticket: ${commentError?.message}`);
      }

      toast.success("Your report has been sent and a task has been created. Thank you!");
      onOpenChange(false);
      setDescription("");
      setAttachments([]);
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
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="attachment" className="text-right pt-2">
                Attachments
              </Label>
              <div className="col-span-3 space-y-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <FileUp className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
                <Input
                  id="attachment"
                  type="file"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                />
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded-md">
                        <div className="flex items-center gap-2 truncate">
                          <Paperclip className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAttachment(file)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
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