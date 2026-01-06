import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProjectReportsListProps {
  projectId: string;
}

const ProjectReportsList = ({ projectId }: ProjectReportsListProps) => {
  const { data: reports, isLoading } = useQuery({
    queryKey: ["project-reports", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_reports")
        .select(`
          id,
          content,
          created_at,
          created_by,
          profiles:created_by (
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!reports?.length) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No quick reports submitted yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => {
        const profile = report.profiles as any;
        const name = profile?.first_name 
          ? `${profile.first_name} ${profile.last_name || ''}`.trim()
          : profile?.email || 'Unknown User';
        const initials = name.substring(0, 2).toUpperCase();

        return (
          <Card key={report.id} className="bg-muted/30 border-none shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 mt-0.5">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{name}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(report.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {report.content}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProjectReportsList;