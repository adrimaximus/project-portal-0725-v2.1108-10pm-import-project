import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ListChecks, Download } from 'lucide-react';
import { formatInJakarta } from '@/lib/utils';

interface ProjectReportProps {
  project: Project;
}

const ProjectReport = ({ project }: ProjectReportProps) => {
  const totalTasks = project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter(t => t.completed).length || 0;
  const completionDate = project.status === 'Completed' ? project.updated_at : null;

  const isCompleted = project.status === 'Completed';

  return (
    <Card className={isCompleted ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}>
      <CardHeader>
        <div className="flex items-center gap-3">
          {isCompleted ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <XCircle className="h-6 w-6 text-red-600" />
          )}
          <div>
            <CardTitle>Project Report</CardTitle>
            <CardDescription>
              This project was marked as {project.status.toLowerCase()}.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-2"><ListChecks className="h-4 w-4" /> Total Tasks</span>
          <span className="font-medium">{completedTasks} / {totalTasks}</span>
        </div>
        {completionDate && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Completion Date</span>
            <span className="font-medium">{formatInJakarta(completionDate, 'dd MMM yyyy')}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Download Full Report
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectReport;