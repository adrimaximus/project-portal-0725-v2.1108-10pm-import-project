import { Project } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ProjectOverviewProps {
  projects: Project[];
}

const ProjectOverview = ({ projects }: ProjectOverviewProps) => {
  const getStatusClass = (status: Project['status']) => {
    switch (status) {
      case 'On Track': return 'bg-green-100 text-green-800 border-green-200';
      case 'At Risk': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Off Track': return 'bg-red-100 text-red-800 border-red-200';
      case 'Completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tinjauan Proyek</CardTitle>
        <CardDescription>Lacak kemajuan semua proyek aktif Anda.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Nama Proyek</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tim</TableHead>
              <TableHead>Kemajuan</TableHead>
              <TableHead className="text-right">Terakhir Diperbarui</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("border", getStatusClass(project.status))}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {project.team.map((member, index) => (
                      <Avatar key={member.name} className={cn("h-8 w-8 border-2 border-background", index > 0 && "-ml-3")}>
                        <AvatarImage src={member.src} alt={member.name} />
                        <AvatarFallback>{member.fallback}</AvatarFallback>
                      </Avatar>
                    ))}
                     {project.team.length === 0 && <span className="text-sm text-muted-foreground">No team</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="w-[100px]" />
                    <span className="text-sm text-muted-foreground">{project.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">{project.lastUpdated}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ProjectOverview;