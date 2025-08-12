import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Project, UserProfile } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import StatusBadge from '@/components/StatusBadge';
import { MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectsTableProps {
  projects: Project[];
}

const TeamAvatars = ({ members }: { members: UserProfile[] }) => {
  if (!members || members.length === 0) {
    return <div className="text-sm text-muted-foreground">No members</div>;
  }

  return (
    <div className="flex items-center -space-x-2">
      {members.slice(0, 3).map((member) => (
        <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
          <AvatarImage src={member.avatar} alt={member.name} />
          <AvatarFallback>{member.initials}</AvatarFallback>
        </Avatar>
      ))}
      {members.length > 3 && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium border-2 border-background">
          +{members.length - 3}
        </div>
      )}
    </div>
  );
};

const ProjectsTable = ({ projects }: ProjectsTableProps) => {
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const queryClient = useQueryClient();

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectToDelete.id);

    if (error) {
      toast.error('Gagal menghapus proyek', { description: error.message });
    } else {
      toast.success(`Proyek "${projectToDelete.name}" berhasil dihapus.`);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
    setProjectToDelete(null);
  };

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Nama Proyek</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tim</TableHead>
              <TableHead>Progres</TableHead>
              <TableHead>Tenggat Waktu</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects && projects.length > 0 ? (
              projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Link to={`/projects/${project.slug}`} className="font-medium text-primary hover:underline">
                      {project.name}
                    </Link>
                    <p className="text-sm text-muted-foreground truncate">{project.category}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={project.status} />
                  </TableCell>
                  <TableCell>
                    <TeamAvatars members={project.assignedTo} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress} className="w-24" />
                      <span className="text-sm text-muted-foreground">{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.dueDate ? format(new Date(project.dueDate), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                          <Link to={`/projects/${project.slug}`} className="flex items-center cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" /> Lihat
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-500 cursor-pointer"
                          onClick={() => setProjectToDelete(project)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Tidak ada proyek yang ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan menghapus proyek "{projectToDelete?.name}" secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectsTable;