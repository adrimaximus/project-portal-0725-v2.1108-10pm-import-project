import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, User, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const isImage = (filename: string) => {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(filename);
};

const ProjectReportsList = ({ projectId }: ProjectReportsListProps) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from("project_reports")
        .delete()
        .eq("id", reportId);

      if (error) throw error;
      
      // Optimistic update or refetch handled by subscription
    } catch (error) {
      console.error("Error deleting report:", error);
    }
  };

  useEffect(() => {
    fetchReports();

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

  if (loading) {
    return (
      <div className="space-y-6 pt-2">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
        No reports submitted yet.
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      {reports.map((report) => {
        const hasAttachments = report.attachments && Array.isArray(report.attachments) && report.attachments.length > 0;
        const images = hasAttachments ? report.attachments.filter((f: any) => isImage(f.name)) : [];
        const files = hasAttachments ? report.attachments.filter((f: any) => !isImage(f.name)) : [];

        return (
          <div key={report.id} className="flex gap-4 group">
            {/* Avatar */}
            <Avatar className="h-10 w-10 border border-border/50 shadow-sm mt-1">
              <AvatarImage src={report.profiles?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/5 text-primary text-xs font-medium">
                {report.profiles?.first_name?.[0] || <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              {/* Header: Name & Time */}
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="font-semibold text-sm text-foreground">
                  {report.profiles?.first_name 
                    ? `${report.profiles.first_name} ${report.profiles.last_name || ""}`
                    : report.profiles?.email || "Unknown User"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                </span>
              </div>

              {/* Bubble Content */}
              <div className="bg-muted/40 hover:bg-muted/60 transition-colors p-4 rounded-2xl rounded-tl-none border border-border/40 relative">
                <div className="flex justify-between gap-4">
                  <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed break-words w-full">
                    {report.content || <span className="italic text-muted-foreground">No text content</span>}
                  </div>
                  
                  {/* Menu */}
                  <div className="shrink-0 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive cursor-pointer"
                          onClick={() => handleDelete(report.id)}
                        >
                          Delete Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Attachments */}
                {hasAttachments && (
                  <div className="mt-3 space-y-3">
                    {/* Image Grid */}
                    {images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {images.map((file: any, index: number) => (
                          <a 
                            key={index}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-square rounded-lg overflow-hidden border bg-background group/image transition-all hover:ring-2 hover:ring-primary/20"
                          >
                            <img 
                              src={file.url} 
                              alt={file.name} 
                              className="object-cover w-full h-full transition-transform duration-300 group-hover/image:scale-105" 
                            />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* File List */}
                    {files.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {files.map((file: any, index: number) => (
                          <a
                            key={index}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs bg-background/80 hover:bg-background border p-2 pr-3 rounded-md transition-colors group/file shadow-sm"
                          >
                            <div className="p-1.5 bg-primary/10 rounded text-primary">
                              <FileText className="h-3.5 w-3.5" />
                            </div>
                            <span className="truncate max-w-[150px] font-medium text-foreground/80">{file.name}</span>
                            <Download className="h-3 w-3 text-muted-foreground opacity-50 group-hover/file:opacity-100 transition-opacity ml-1" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ));
      })}
    </div>
  );
};

export default ProjectReportsList;