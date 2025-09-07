import React, { useMemo } from 'react';
import { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from 'react-router-dom';
import { generatePastelColor, getAvatarUrl, getStatusColor } from '@/lib/utils';
import { useProfiles } from '@/hooks/useProfiles';

interface RecentProjectsProps {
  projects: Project[];
}

const RecentProjects = ({ projects }: RecentProjectsProps) => {
  const { data: allProfiles = [] } = useProfiles();

  const enrichedProjects = useMemo(() => {
    if (!allProfiles.length) return projects;

    const profilesMap = new Map(allProfiles.map(p => [p.id, p]));

    return projects.map(project => ({
      ...project,
      assignedTo: project.assignedTo.map(userFromProject => {
        const freshProfile = profilesMap.get(userFromProject.id);
        if (!freshProfile) return userFromProject;

        return {
          ...userFromProject,
          avatar_url: freshProfile.avatar_url,
          name: [freshProfile.first_name, freshProfile.last_name].filter(Boolean).join(' ') || freshProfile.email?.split('@')[0] || 'No Name',
          initials: `${freshProfile.first_name?.[0] || ''}${freshProfile.last_name?.[0] || ''}`.toUpperCase() || 'NN',
        };
      })
    }));
  }, [projects, allProfiles]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Link to={`/projects/${project.slug}`} className="font-medium hover:underline">{project.name}</Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" style={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center -space-x-2">
                        {project.assignedTo.map(user => (
                          <Tooltip key={user.id}>
                            <TooltipTrigger asChild>
                              <Avatar className="h-8 w-8 border-2 border-card">
                                <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} alt={user.name} />
                                <AvatarFallback style={generatePastelColor(user.id)}>{user.initials}</AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{user.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {project.due_date ? new Date(project.due_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default RecentProjects;