import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, User, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AttachmentViewerModal from "@/components/AttachmentViewerModal";

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
}

interface ProjectReportsListProps {
  projectId: string;
}

const ProjectReportsList = ({ projectId }: ProjectReportsListProps) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  
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
          <Card key={report.id} className="overflow-hidden bg-card/50">
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
              </div>
            </CardHeader>
            <CardContent className="p-4">
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
                    
                    return (
                      <div key={index} className="w-[60px] h-[60px] relative">
                        {file.type?.startsWith('image/') ? (
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