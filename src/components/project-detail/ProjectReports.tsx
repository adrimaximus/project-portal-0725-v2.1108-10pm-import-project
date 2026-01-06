import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Paperclip, Download } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface ProjectReportsProps {
  projectId: string;
}

const ProjectReports = ({ projectId }: ProjectReportsProps) => {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['project_reports', projectId],
    queryFn: async () => {
      // Fetch comments that have attachments (treated as reports)
      // and are not marked as tickets (if applicable)
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          text,
          created_at,
          attachments_jsonb,
          author_id,
          profiles:author_id (
            first_name,
            last_name,
            email,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .neq('attachments_jsonb', '[]') // Only get comments with attachments
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading reports...</div>;
  }

  if (!reports || reports.length === 0) {
    return null; // Don't show the section if no reports exist
  }

  return (
    <Card className="mt-6 border-l-4 border-l-primary/50">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Project Reports & Files
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        {reports.map((report: any) => {
          const author = report.profiles;
          const initials = author 
            ? (author.first_name?.[0] || '') + (author.last_name?.[0] || '') 
            : '??';
          const authorName = author 
            ? `${author.first_name || ''} ${author.last_name || ''}`.trim() || author.email 
            : 'Unknown User';

          return (
            <div key={report.id} className="flex gap-4">
              <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                <AvatarImage src={author?.avatar_url} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{authorName}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(report.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-foreground/90 bg-muted/30 p-3 rounded-lg border">
                  <p className="whitespace-pre-wrap">{report.text}</p>
                </div>

                {report.attachments_jsonb && report.attachments_jsonb.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {report.attachments_jsonb.map((file: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/5 transition-colors group"
                      >
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                          <Paperclip className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-[100px] max-w-[200px]">
                          <span className="text-xs font-medium truncate" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {file.size ? (file.size / 1024).toFixed(0) + ' KB' : 'File'}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => window.open(file.url, '_blank')}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default ProjectReports;