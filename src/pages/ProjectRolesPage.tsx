import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { dummyProjects } from "@/data/projects";
import { allUsers } from "@/data/users";
import { ProjectRole } from '@/types';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

const ProjectRolesPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user: currentUser } = useUser();
  const project = dummyProjects.find(p => p.id === projectId);
  
  const [collaborators, setCollaborators] = useState(project?.collaborators || []);

  if (!project) {
    return <PortalLayout><div>Project not found.</div></PortalLayout>;
  }

  const projectOwnerId = project.collaborators.find(c => c.role === 'Project Owner')?.userId;
  const isOwner = currentUser.id === projectOwnerId;

  const handleRoleChange = (userId: string, role: ProjectRole) => {
    setCollaborators(collaborators.map(c => c.userId === userId ? { ...c, role } : c));
  };

  const handleInvite = (role: 'Client' | 'Assignee') => {
    toast.success(`${role} invitation sent!`);
  };

  return (
    <PortalLayout>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link to={`/projects/${projectId}`}>Project: {project.name}</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Role Management</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="mt-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Role Management</h1>
          <p className="text-muted-foreground">Manage roles for collaborators on this project.</p>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Collaborators</CardTitle>
              <CardDescription>A list of all collaborators for this project.</CardDescription>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <Button onClick={() => handleInvite('Client')}>Invite Client</Button>
                <Button onClick={() => handleInvite('Assignee')}>Invite Assignee</Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collaborator</TableHead>
                  <TableHead>Project Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collaborators.map(collaborator => {
                  const user = allUsers.find(u => u.id === collaborator.userId);
                  if (!user) return null;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.initials}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={collaborator.role}
                          onValueChange={(value) => handleRoleChange(user.id, value as ProjectRole)}
                          disabled={!isOwner || collaborator.role === 'Project Owner'}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Project Owner">Project Owner</SelectItem>
                            <SelectItem value="Client">Client</SelectItem>
                            <SelectItem value="Assignee">Assignee</SelectItem>
                            <SelectItem value="Custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default ProjectRolesPage;