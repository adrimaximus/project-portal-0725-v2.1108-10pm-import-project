import React, { useState, useMemo } from 'react';
import { Project, UserProfile } from '@/types';
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';

interface CollaboratorsListProps {
  projects: Project[];
}

type CollaboratorStat = UserProfile & {
  projectCount: number;
  totalValue: number;
};

const CollaboratorsList = ({ projects }: CollaboratorsListProps) => {
  const [view, setView] = useState<'summary' | 'details'>('summary');

  const collaborators: CollaboratorStat[] = useMemo(() => {
    const collaboratorStats: { [key: string]: CollaboratorStat } = {};
    projects.forEach(p => {
      const members = (p.assignedTo || []);
      if (p.created_by && typeof p.created_by === 'object') {
        members.push(p.created_by);
      }
      
      const uniqueMembers = Array.from(new Map(members.map(m => [m.id, m])).values());

      uniqueMembers.forEach(collaborator => {
        if (!collaboratorStats[collaborator.id]) {
          collaboratorStats[collaborator.id] = { ...collaborator, projectCount: 0, totalValue: 0 };
        }
        collaboratorStats[collaborator.id].projectCount++;
        if (p.created_by && typeof p.created_by === 'object' && p.created_by.id === collaborator.id) {
          collaboratorStats[collaborator.id].totalValue += p.budget || 0;
        }
      });
    });
    return Object.values(collaboratorStats).sort((a, b) => b.projectCount - a.projectCount);
  }, [projects]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="text-lg">Collaborators</CardTitle>
          <div className="flex items-center">
            <TooltipProvider>
              <div className="flex -space-x-2 overflow-hidden">
                {collaborators.slice(0, 5).map(c => (
                      <Tooltip key={c.id}>
                        <TooltipTrigger asChild>
                          <Avatar className="h-8 w-8 border-2 border-card">
                            <AvatarImage src={getAvatarUrl(c.avatar_url, c.id)} alt={c.name} />
                            <AvatarFallback style={generatePastelColor(c.id)}>{c.initials}</AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{c.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
              </div>
            </TooltipProvider>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Projects</TableHead>
                <TableHead className="text-right">Total Value (Owner)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collaborators.map(c => (
                              <TableRow key={c.id}>
                                  <TableCell>
                                      <div className="flex items-center gap-2">
                                          <Avatar className="h-8 w-8">
                                              <AvatarImage src={getAvatarUrl(c.avatar_url, c.id)} alt={c.name} />
                                              <AvatarFallback style={generatePastelColor(c.id)}>{c.initials}</AvatarFallback>
                                          </Avatar>
                                          <span className="font-medium whitespace-nowrap">{c.name}</span>
                                      </div>
                                  </TableCell>
                                  <TableCell className="text-right">{c.projectCount}</TableCell>
                                  <TableCell className="text-right">${c.totalValue.toLocaleString()}</TableCell>
                              </TableRow>
                          ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CollaboratorsList;