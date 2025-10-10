import { useState, useMemo } from "react";
import { Project } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProjectStatusStyles, formatInJakarta, generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { isBefore, startOfToday } from 'date-fns';

const ProjectTable = ({ projects, onDeleteProject, navigate }: { projects: Project[], onDeleteProject: (id: string) => void, navigate: (path: string) => void }) => {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Proyek</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Pembayaran</TableHead>
            <TableHead>Jatuh Tempo</TableHead>
            <TableHead>Tim</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const statusStyles = getProjectStatusStyles(project.status);
            const paymentStatusStyles = getProjectStatusStyles(project.payment_status, true);
            return (
              <TableRow key={project.id} onClick={() => navigate(`/projects/${project.slug}`)} className="cursor-pointer">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {project.status === 'Completed' && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
                    <span className="truncate" title={project.name}>{project.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge style={{ backgroundColor: statusStyles.hex, color: statusStyles.textColor }} className="border-transparent">
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge style={{ backgroundColor: paymentStatusStyles.hex, color: paymentStatusStyles.textColor }} className="border-transparent">
                    {project.payment_status}
                  </Badge>
                </TableCell>
                <TableCell>{project.due_date ? formatInJakarta(project.due_date, 'd MMM yyyy') : 'N/A'}</TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {project.assignedTo.slice(0, 3).map((user) => (
                      <Avatar key={user.id} className="h-8 w-8 border-2 border-background">
                        <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} alt={user.name} />
                        <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-destructive" onSelect={() => onDeleteProject(project.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

const TableView = ({ projects, onDeleteProject }: { projects: Project[], onDeleteProject: (projectId: string) => void }) => {
  const navigate = useNavigate();
  const [visibleUpcomingCount, setVisibleUpcomingCount] = useState(10);
  const [visiblePastCount, setVisiblePastCount] = useState(5);

  const { upcomingProjects, pastProjects } = useMemo(() => {
    const today = startOfToday();
    const projectsWithDates = projects.filter(p => p.due_date);

    const upcoming = projectsWithDates
      .filter(p => !isBefore(new Date(p.due_date!), today))
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

    const past = projectsWithDates
      .filter(p => isBefore(new Date(p.due_date!), today))
      .sort((a, b) => new Date(b.due_date!).getTime() - new Date(a.due_date!).getTime());
    
    return { upcomingProjects: upcoming, pastProjects: past };
  }, [projects]);

  if (projects.length > 0 && upcomingProjects.length === 0 && pastProjects.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        Tidak ada proyek dengan tanggal jatuh tempo untuk ditampilkan.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {upcomingProjects.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold my-4 px-1">Proyek Akan Datang</h3>
          <ProjectTable projects={upcomingProjects.slice(0, visibleUpcomingCount)} onDeleteProject={onDeleteProject} navigate={navigate} />
          {upcomingProjects.length > visibleUpcomingCount && (
            <div className="text-center mt-6">
              <Button variant="outline" onClick={() => setVisibleUpcomingCount(prev => prev + 10)}>
                Muat Lebih Banyak
              </Button>
            </div>
          )}
        </div>
      )}

      {pastProjects.length > 0 && (
        <div>
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm font-medium text-muted-foreground">
                Proyek Sudah Lewat
              </span>
            </div>
          </div>
          <ProjectTable projects={pastProjects.slice(0, visiblePastCount)} onDeleteProject={onDeleteProject} navigate={navigate} />
          {pastProjects.length > visiblePastCount && (
            <div className="text-center mt-6">
              <Button variant="outline" onClick={() => setVisiblePastCount(prev => prev + 10)}>
                Muat Lebih Banyak
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TableView;