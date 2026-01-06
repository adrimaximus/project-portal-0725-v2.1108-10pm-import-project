import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, User, Paperclip, MoreHorizontal, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AttachmentViewerModal from "@/components/AttachmentViewerModal";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EmojiReactionPicker from "@/components/EmojiReactionPicker";
import { cn } from "@/lib/utils";

interface ReportReaction {
  id: string;
  emoji: string;
  user_id: string;
}

interface Report {
  id: string;
  content: string;
  attachments: any[];
  created_at: string;
  created_by: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  project_report_reactions?: ReportReaction[];
}

interface ProjectReportsListProps {
  projectId: string;
}

const isImageFile = (file: any) => {
  if (file.type?.startsWith("image/")) return true;
  const name = file.name || "";
  const ext = name.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext || "");
};

const ProjectReportsList = ({ projectId }: ProjectReportsListProps) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editAttachments, setEditAttachments] = useState<any[]>([]);
  const [editNewFiles, setEditNewFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Attachment Viewer State
  const [viewerAttachments, setViewerAttachments] = useState<any[]>([]);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerReportId, setViewerReportId] = useState("");

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("project_reports")
        .select(`
          *,
          profiles:created_by (
            first_name,
            last_name,
            email,
            avatar_url
          ),
          project_report_reactions (
            id,
            emoji,
            user_id
          )
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reports:", error);
        return;
      }

      setReports(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("project-reports-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_reports",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchReports();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_report_reactions",
        },
        () => {
          // Ideally we'd filter by report IDs but for simplicity we refetch
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const handleViewAttachments = (attachments: any[], reportId: string) => {
    setViewerAttachments(attachments);
    setViewerReportId(reportId);
    setIsViewerOpen(true);
  };

  const handleEditClick = (report: Report) => {
    setEditingReportId(report.id);
    setEditContent(report.content || "");
    setEditAttachments(report.attachments || []);
    setEditNewFiles([]);
  };

  const handleCancelEdit = () => {
    setEditingReportId(null);
    setEditContent("");
    setEditAttachments([]);
    setEditNewFiles([]);
  };

  const handleUpdateReport = async (reportId: string) => {
    setIsSubmitting(true);
    try {
      let updatedAttachments = [...editAttachments];

      // Upload new files if any
      if (editNewFiles.length > 0) {
        const uploadPromises = editNewFiles.map(async (file) => {
          const fileName = `${projectId}/${Date.now()}-${file.name.replace(/[^\x00-\x7F]/g, "")}`;
          const { error: uploadError } = await supabase.storage
            .from('project-files')
            .upload(fileName, file);
          
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl } } = supabase.storage
            .from('project-files')
            .getPublicUrl(fileName);
            
          return {
            name: file.name,
            url: publicUrl,
            type: file.type,
            size: file.size,
            storagePath: fileName
          };
        });

        const newAttachments = await Promise.all(uploadPromises);
        updatedAttachments = [...updatedAttachments, ...newAttachments];
      }

      const { error } = await supabase
        .from('project_reports')
        .update({
          content: editContent,
          attachments: updatedAttachments
        })
        .eq('id', reportId);

      if (error) throw error;

      toast.success("Report updated successfully");
      handleCancelEdit();
      fetchReports();
    } catch (error: any) {
      console.error("Error updating report:", error);
      toast.error(`Failed to update report: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      const { error } = await supabase
        .from('project_reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;
      toast.success("Report deleted successfully");
      fetchReports();
    } catch (error: any) {
      console.error("Error deleting report:", error);
      toast.error(`Failed to delete report: ${error.message}`);
    }
  };

  const handleReaction = async (reportId: string, emoji: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.rpc('toggle_report_reaction', {
        p_report_id: reportId,
        p_emoji: emoji
      });

      if (error) throw error;
      // Realtime subscription will handle refresh
    } catch (error: any) {
      console.error("Error toggling reaction:", error);
      toast.error("Failed to add reaction");
    }
  };

  // Group reactions by emoji
  const getGroupedReactions = (reactions: ReportReaction[] = []) => {
    const groups: Record<string, { count: number; hasReacted: boolean }> = {};
    reactions.forEach(r => {
      if (!groups[r.emoji]) {
        groups[r.emoji] = { count: 0, hasReacted: false };
      }
      groups[r.emoji].count++;
      if (r.user_id === user?.id) {
        groups[r.emoji].hasReacted = true;
      }
    });
    return Object.entries(groups);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8 bg-muted/30 rounded-md border border-dashed">
        No reports submitted yet.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="overflow-visible bg-card/50">
            <CardHeader className="p-4 bg-muted/30 pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={report.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {report.profiles?.first_name?.[0] || <User className="h-3 w-3" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium leading-none mb-1">
                      {report.profiles?.first_name 
                        ? `${report.profiles.first_name} ${report.profiles.last_name || ""}`
                        : report.profiles?.email || "Unknown User"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(report.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                </div>
                {user?.id === report.created_by && !editingReportId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClick(report)}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteReport(report.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {editingReportId === report.id ? (
                <div className="space-y-4">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[100px]"
                    placeholder="Report content..."
                  />
                  
                  {/* Attachment Management in Edit Mode */}
                  {(editAttachments.length > 0 || editNewFiles.length > 0) && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {/* Existing attachments */}
                      {editAttachments.map((att: any, idx: number) => (
                        <div key={`existing-${idx}`} className="aspect-square relative group">
                          {isImageFile(att) ? (
                            <div className="w-full h-full rounded-md overflow-hidden border border-border/50 bg-background">
                              <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-full h-full rounded-md overflow-hidden border border-border/50 bg-muted/30 flex flex-col items-center justify-center p-1">
                              <FileText className="h-6 w-6 text-muted-foreground mb-1" />
                              <span className="text-[8px] text-muted-foreground w-full truncate text-center">{att.name}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditAttachments(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0 right-0 bg-black/50 hover:bg-destructive text-white p-0.5 rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {/* New attachments */}
                      {editNewFiles.map((file, idx) => (
                        <div key={`new-${idx}`} className="aspect-square relative group">
                          {file.type?.startsWith('image/') ? (
                            <div className="w-full h-full rounded-md overflow-hidden border border-border/50 bg-background">
                              <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-full h-full rounded-md overflow-hidden border border-border/50 bg-muted/30 flex flex-col items-center justify-center p-1">
                              <FileText className="h-6 w-6 text-muted-foreground mb-1" />
                              <span className="text-[8px] text-muted-foreground w-full truncate text-center">{file.name}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditNewFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0 right-0 bg-black/50 hover:bg-destructive text-white p-0.5 rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center">
                      <label 
                        htmlFor={`edit-file-input-${report.id}`}
                        className="inline-flex h-9 px-3 items-center justify-center rounded-md border border-input bg-transparent text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground cursor-pointer text-muted-foreground hover:text-primary gap-2"
                      >
                        <Paperclip className="h-4 w-4" />
                        <span>Attach files</span>
                      </label>
                      <input 
                        id={`edit-file-input-${report.id}`}
                        type="file" 
                        className="hidden" 
                        multiple
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setEditNewFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
                          }
                          e.target.value = '';
                        }} 
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSubmitting}>Cancel</Button>
                      <Button size="sm" onClick={() => handleUpdateReport(report.id)} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 mb-3">
                    {report.content || <span className="italic text-muted-foreground">No text content</span>}
                  </div>
                  
                  {report.attachments && Array.isArray(report.attachments) && report.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border/50">
                      {report.attachments.slice(0, 4).map((file: any, index: number) => {
                        const displayCount = 4;
                        const totalCount = report.attachments.length;
                        const extraCount = totalCount - (displayCount - 1);
                        const isOverlay = index === 3 && totalCount > 4;
                        const isImg = isImageFile(file);
                        
                        return (
                          <div key={index} className="w-[60px] h-[60px] relative">
                            {isImg ? (
                              <div className="w-full h-full rounded-md overflow-hidden border border-border/50 bg-background hover:opacity-90 transition-opacity relative">
                                <button 
                                  onClick={() => handleViewAttachments(report.attachments, report.id)} 
                                  className="w-full h-full flex items-center justify-center cursor-pointer"
                                  type="button"
                                >
                                  <img 
                                    src={file.url} 
                                    alt={file.name} 
                                    className="w-full h-full object-cover" 
                                    loading="lazy"
                                  />
                                </button>
                                {isOverlay && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none rounded-md">
                                    <span className="text-xs font-medium text-white">+{extraCount}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="w-full h-full rounded-md overflow-hidden border border-border/50 bg-muted/30 hover:opacity-90 transition-opacity relative">
                                <button 
                                  onClick={() => handleViewAttachments(report.attachments, report.id)}
                                  className="flex flex-col items-center justify-center w-full h-full p-1 text-center cursor-pointer"
                                  type="button"
                                >
                                  {file.type === 'application/pdf' ? (
                                    <FileText className="h-6 w-6 text-red-500 mb-0.5" />
                                  ) : (
                                    <Paperclip className="h-6 w-6 text-muted-foreground mb-0.5" />
                                  )}
                                  <span className="text-[8px] text-muted-foreground w-full truncate px-0.5">
                                    {file.name}
                                  </span>
                                </button>
                                {isOverlay && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none rounded-md">
                                    <span className="text-xs font-medium text-white">+{extraCount}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Reactions Section */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-2">
                    <EmojiReactionPicker onSelect={(emoji) => handleReaction(report.id, emoji)} />
                    {getGroupedReactions(report.project_report_reactions).map(([emoji, { count, hasReacted }]) => (
                      <Button
                        key={emoji}
                        variant={hasReacted ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => handleReaction(report.id, emoji)}
                        className={cn(
                          "h-7 px-2 text-xs rounded-full gap-1.5",
                          hasReacted 
                            ? "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20" 
                            : "bg-muted/50 hover:bg-muted text-muted-foreground border border-transparent"
                        )}
                      >
                        <span>{emoji}</span>
                        {count > 0 && <span className="font-medium">{count}</span>}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <AttachmentViewerModal
        open={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        attachments={viewerAttachments}
        commentId={viewerReportId} 
      />
    </>
  );
};

export default ProjectReportsList;