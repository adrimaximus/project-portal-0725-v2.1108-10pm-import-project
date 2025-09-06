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

    try {
      if (attachment) {
        const filePath = `support/${user.id}/${Date.now()}-${attachment.name}`;
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
      }

      const { error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        report_type: reportType,
        description,
        attachment_url: attachmentUrl,
      });

      if (error) throw error;

      toast.success("Your report has been sent. Thank you!");
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
                placeholder={reportType === 'bug' ? "What's the bug? What did you expect?" : "Please describe the issue."}
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