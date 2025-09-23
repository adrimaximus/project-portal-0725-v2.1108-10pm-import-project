import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProjectDiagnosticsProps {
  asIcon?: boolean;
}

const ProjectDiagnostics = ({ asIcon = false }: ProjectDiagnosticsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const handleRunDiagnostics = async () => {
    setIsLoading(true);
    setReport(null);
    setIsOpen(true);
    try {
      const { data, error } = await supabase.functions.invoke('diagnose-projects');
      if (error) throw error;
      setReport(data.result);
    } catch (error: any) {
      toast.error("Failed to run diagnostics.", { description: error.message });
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const dialogContent = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Project Visibility Diagnostics</DialogTitle>
        <DialogDescription>
          Here's an AI-powered analysis of your project data and security settings.
        </DialogDescription>
      </DialogHeader>
      <div className="prose prose-sm dark:prose-invert max-w-none py-4">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ReactMarkdown>{report || "No report generated."}</ReactMarkdown>
        )}
      </div>
      <DialogFooter>
        <Button onClick={() => setIsOpen(false)}>Close</Button>
      </DialogFooter>
    </DialogContent>
  );

  if (asIcon) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={handleRunDiagnostics}>
                <AlertTriangle className="h-4 w-4" />
                <span className="sr-only">Run Diagnostics</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Run Project Diagnostics</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button variant="outline" size="sm" onClick={handleRunDiagnostics}>
        <AlertTriangle className="mr-2 h-4 w-4" />
        Run Diagnostics
      </Button>
      {dialogContent}
    </Dialog>
  );
};

export default ProjectDiagnostics;