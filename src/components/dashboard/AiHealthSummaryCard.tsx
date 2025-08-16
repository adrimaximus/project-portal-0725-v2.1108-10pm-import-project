import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { Project } from '@/types';
import { analyzeProjects } from '@/lib/openai';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface AiHealthSummaryCardProps {
  projects: Project[];
}

const AiHealthSummaryCard = ({ projects }: AiHealthSummaryCardProps) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetSummary = async () => {
    setIsLoading(true);
    try {
      const result = await analyzeProjects('summarize_health');
      setSummary(result);
    } catch (error: any) {
      toast.error("Failed to get AI summary", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">AI Project Health Summary</CardTitle>
        <Sparkles className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {summary ? (
          <div className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Get a quick summary of your project health, including status distribution and potential risks.
          </p>
        )}
        <Button size="sm" variant="outline" className="mt-4" onClick={handleGetSummary} disabled={isLoading || projects.length === 0}>
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
          ) : (
            <>{summary ? 'Refresh Summary' : 'Get AI Summary'}</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AiHealthSummaryCard;