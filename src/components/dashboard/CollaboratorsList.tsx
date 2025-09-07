import React, { useState, useMemo } from 'react';
import { Project, User } from '@/types';
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronsUpDown } from "lucide-react";
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { useProfiles } from '@/hooks/useProfiles';

interface CollaboratorsListProps {
  projects: Project[];
}

interface CollaboratorStat extends User {
  projectCount: number;
}

const CollaboratorsList = ({ projects }: CollaboratorsListProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: allProfiles = [] } = useProfiles();

  const collaborators = useMemo(() => {
    const profilesMap = new Map(allProfiles.map(p => [p.id, p]));

    const collaboratorStats = projects.reduce((acc, p) => {
        p.assignedTo.forEach(userFromProject => {
            const freshProfile = profilesMap.get(userFromProject.id);
            
            const finalUser = freshProfile ? {
                ...userFromProject,
                id: freshProfile.id,
                avatar_url: freshProfile.avatar_url,
                name: [freshProfile.first_name, freshProfile.last_name].filter(Boolean).join(' ') || freshProfile.email?.split('@')[0] || 'No Name',
                initials: `${freshProfile.first_name?.[0] || ''}${freshProfile.last_name?.[0] || ''}`.toUpperCase() || 'NN',
            } : userFromProject;

            if (!acc[userFromProject.id]) {
                acc[userFromProject.id] = { ...finalUser, projectCount: 0 };
            }
            acc[userFromProject.id].projectCount++;
        });
        return acc;
    }, {} as Record<string, CollaboratorStat>);

    return Object.values(collaboratorStats).sort((a, b) => b.projectCount - a.projectCount);
  }, [projects, allProfiles]);

  return (
    <Card>
      <TooltipProvider>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="w-full p-6">
            <div className="flex items-center justify-between">
              <CardTitle>Collaborators</CardTitle>
              <div className="flex items-center gap-4">
                {!isOpen && (
                  <div className="flex items-center -space-x-2">
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
                )}
                <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="px-6 pb-6 pt-0">
                <div className="overflow-x-auto">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Collaborator</TableHead>
                              <TableHead className="text-right">Projects</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {collaborators.map(c => (
                              <TableRow key={c.id}>
                                  <TableCell>
                                      <div className="flex items-center gap-3">
                                          <Avatar className="h-8 w-8">
                                              <AvatarImage src={getAvatarUrl(c.avatar_url, c.id)} alt={c.name} />
                                              <AvatarFallback style={generatePastelColor(c.id)}>{c.initials}</AvatarFallback>
                                          </Avatar>
                                          <span className="font-medium whitespace-nowrap">{c.name}</span>
                                      </div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">{c.projectCount}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
                </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </TooltipProvider>
    </Card>
  );
};

export default CollaboratorsList;