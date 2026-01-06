import { useState, useRef } from "react";
import { Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Paperclip, X, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ProjectReportCardProps {
  project: Project;
}

const ProjectReportCard = ({ project }: ProjectReportCardProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files || [])]);
    }
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const submitReportMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");

      let attachments: any[] = [];

      if (files.length > 0) {
        const uploadPromises = files.map(async (file) => {
          const fileName = `${project.id}/${Date.now()}-${file.name.replace(/[^\x00-\x7F]/g, "")}`;
          
          // Using 'project-files' bucket. Ensure this bucket exists and has proper RLS policies.
          const { error: uploadError } = await supabase.storage
            .from('project-files') 
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('project-files')
            .getPublicUrl(fileName);

          // Insert into project_files table to track it globally and generate activity
          const { error: dbError } = await supabase
            .from('project_files')
            .insert({
              project_id: project.id,
              user_id: user.id,
              name: file.name,
              size: file.size,
              type: file.type,
              url: publicUrl,
              storage_path: fileName
            });

          if (dbError) throw dbError;

          return {
            name: file.name,
            url: publicUrl,
            type: file.type,
            size: file.size,
            storagePath: fileName
          };
        });

        attachments = await Promise.all(uploadPromises);
      }

      // Ensure text is not empty for the activity log to be meaningful
      const commentText = content.trim() || (files.length > 0 ? `Submitted a report with ${files.length} file(s).` : "Submitted a report.");

      // Insert into comments as a report/update
      const { error } = await supabase
        .from('comments')
        .insert({
          project_id: project.id,
          author_id: user.id,
          text: commentText,
          attachments_jsonb: attachments,
          is_ticket: false 
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report submitted successfully");
      setContent("");
      setFiles([]);
      // Invalidate queries broadly to ensure all related feeds update
      queryClient.invalidateQueries({ queryKey: ['project_comments'] });
      queryClient.invalidateQueries({ queryKey: ['project_activities'] });
      queryClient.invalidateQueries({ queryKey: ['project_files'] });
      queryClient.invalidateQueries({ queryKey: ['project', project.slug] });
    },
    onError: (error) => {
      toast.error(`Failed to submit report: ${error.message}`);
    }
  });

  return (
    <Card className="border-dashed shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Quick Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload Area */}
        <div className="space-y-2">
            {files.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                    {files.map((file, index) => (
                        <div key={index} className="group relative flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-accent/5 transition-all">
                            <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <Paperclip className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0 grid gap-0.5">
                                <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                                <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => removeFile(index)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs h-8 border-dashed"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip className="h-3 w-3 mr-2" /> Add another file
                    </Button>
                </div>
            ) : (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer group"
                >
                    <div className="h-8 w-8 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <Paperclip className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-medium group-hover:text-primary transition-colors">Click to upload report/evidence</p>
                    </div>
                </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
        </div>

        {/* Note Area */}
        <div className="space-y-2">
            <Label htmlFor="report-content" className="sr-only">Note</Label>
            <Textarea 
                id="report-content"
                placeholder="Add a note about this update..." 
                className="resize-none min-h-[80px] text-sm"
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-0 pb-4">
        <Button 
            onClick={() => submitReportMutation.mutate()} 
            disabled={(!content.trim() && files.length === 0) || submitReportMutation.isPending}
            size="sm"
            className="w-full sm:w-auto"
        >
            {submitReportMutation.isPending ? (
                <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Sending...
                </>
            ) : (
                <>
                    <Send className="mr-2 h-3 w-3" />
                    Submit Report
                </>
            )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectReportCard;