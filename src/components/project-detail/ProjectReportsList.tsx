import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, User } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

const isImageFile = (file: any) => {
  if (file.type?.startsWith("image/")) return true;
  const name = file.name || "";
  const ext = name.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext || "");
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
                {report.attachments.map((file: any, index: number) => {
                  const isImg = isImageFile(file);
                  return (
                    <a
                      key={index}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block h-24 w-24 overflow-hidden rounded-lg border bg-muted/20 hover:opacity-90 transition-all"
                    >
                      {isImg ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center">
                          <FileText className="h-8 w-8 text-muted-foreground/50 mb-1" />
                          <span className="w-full truncate text-[10px] text-muted-foreground">
                            {file.name}
                          </span>
                        </div>
                      )}
                    </a>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProjectReportsList;