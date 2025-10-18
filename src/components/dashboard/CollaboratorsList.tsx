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
import { generatePastelColor, getAvatarUrl, getInitials } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CollaboratorsListProps {
  projects: Project[];
}

interface CollaboratorStatData {
  user_id: string;
  project_count: number;
  upcoming_project_count: number;
  ongoing_project_count: number;
  active_task_count: number;
  active_ticket_count: number;
  overdue_bill_count: number;
}

interface CollaboratorStat extends User {
  projectCount: number;
  upcomingProjectCount: number;
  ongoingProjectCount: number;
  activeTaskCount: number;
  activeTicketCount: number;
  overdueBillCount: number;
  role: string;
}

const CollaboratorsList = ({ projects }: CollaboratorsListProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const projectIds = useMemo(() => projects.map(p => p.id), [projects]);

  const { data: collaboratorStats, isLoading: isLoadingStats } = useQuery<CollaboratorStatData[]>({
    queryKey: ['collaboratorStats', projectIds],
    queryFn: async () => {
      if (projectIds.length === 0) return [];
      const { data, error } = await supabase.rpc('get_collaborator_stats', { p_project_ids: projectIds });
      if (error) throw error;
      return data;
    },
    enabled: projectIds.length > 0,
  });

  const userIds = useMemo(() => collaboratorStats?.map((s) => s.user_id) || [], [collaboratorStats]);

  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['profilesForStats', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase.from('profiles').select('*').in('id', userIds);
      if (error) throw error;
      return data;
    },
    enabled: userIds.length > 0,
  });

  const { collaboratorsByRole, allCollaborators } = useMemo(() => {
    if (!collaboratorStats || !profiles) return { collaboratorsByRole: {}, allCollaborators: [] };

    const statsMap = new Map(collaboratorStats.map((s) => [s.user_id, s]));
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    const collaborators = Array.from(statsMap.keys()).map(userId => {
      const stats = statsMap.get(userId)!;
      const profile = profileMap.get(userId);
      if (!profile) return null;

      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email;
      
      const collaboratorData: CollaboratorStat = {
        id: userId,
        name: fullName,
        avatar_url: profile.avatar_url,
        email: profile.email,
        initials: getInitials(fullName, profile.email),
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role || 'member',
        status: profile.status,
        updated_at: profile.updated_at,
        phone: profile.phone,
        projectCount: stats.project_count,
        upcomingProjectCount: stats.upcoming_project_count,
        ongoingProjectCount: stats.ongoing_project_count,
        activeTaskCount: stats.active_task_count,
        activeTicketCount: stats.active_ticket_count,
        overdueBillCount: stats.overdue_bill_count,
      };
      return collaboratorData;
    }).filter((c): c is CollaboratorStat => c !== null);

    const roleHierarchy: Record<string, number> = { 'owner': 1, 'admin': 2, 'editor': 3, 'member': 4 };
    
    const grouped: Record<string, CollaboratorStat[]> = {};
    collaborators.forEach(collab => {
        const role = collab.role || 'member';
        if (!grouped[role]) {
            grouped[role] = [];
        }
        grouped[role].push(collab);
    });

    const orderedGrouped: Record<string, CollaboratorStat[]> = {};
    Object.keys(roleHierarchy).forEach(role => {
        if (grouped[role]) {
            orderedGrouped[role] = grouped[role].sort((a, b) => b.projectCount - a.projectCount);
        }
    });
    
    const flatList = Object.values(orderedGrouped).flat();

    return { collaboratorsByRole: orderedGrouped, allCollaborators: flatList };
  }, [collaboratorStats, profiles]);

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
                    {allCollaborators.slice(0, 5).map(c => (
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
              {/* Mobile View */}
              <div className="md:hidden">
                {Object.entries(collaboratorsByRole).map(([role, collaboratorsInRole]) => (
                  <div key={role}>
                    <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider pt-6 pb-2">
                      {role.replace('_', ' ')}
                    </h3>
                    <div className="space-y-4">
                      {collaboratorsInRole.map(c => (
                        <div key={c.id} className="bg-muted/50 p-4 rounded-lg">
                          <div className="flex items-center gap-3 mb-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={getAvatarUrl(c.avatar_url, c.id)} alt={c.name} />
                              <AvatarFallback style={generatePastelColor(c.id)}>{c.initials}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{c.name}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="text-muted-foreground">Total Projects</div>
                            <div className="text-right font-medium">{c.projectCount}</div>
                            <div className="text-muted-foreground">Upcoming</div>
                            <div className="text-right font-medium">{c.upcomingProjectCount}</div>
                            <div className="text-muted-foreground">On Going</div>
                            <div className="text-right font-medium">{c.ongoingProjectCount}</div>
                            <div className="text-muted-foreground">Active Tasks</div>
                            <div className="text-right font-medium">{c.activeTaskCount}</div>
                            <div className="text-muted-foreground">Active Tickets</div>
                            <div className="text-right font-medium">{c.activeTicketCount}</div>
                            <div className="text-muted-foreground">Overdue Bill</div>
                            <div className="text-right font-medium">{c.overdueBillCount}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Collaborator</TableHead>
                            <TableHead className="text-right">Total Projects</TableHead>
                            <TableHead className="text-right">Upcoming</TableHead>
                            <TableHead className="text-right">On Going</TableHead>
                            <TableHead className="text-right">Active Tasks</TableHead>
                            <TableHead className="text-right">Active Tickets</TableHead>
                            <TableHead className="text-right">Overdue Bill</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Object.entries(collaboratorsByRole).map(([role, collaboratorsInRole]) => (
                          <React.Fragment key={role}>
                            <TableRow className="border-b-0 hover:bg-transparent">
                              <TableCell colSpan={7} className="pt-6 pb-2">
                                <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
                                  {role.replace('_', ' ')}
                                </h3>
                              </TableCell>
                            </TableRow>
                            {collaboratorsInRole.map(c => (
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
                                    <TableCell className="text-right font-medium">{c.upcomingProjectCount}</TableCell>
                                    <TableCell className="text-right font-medium">{c.ongoingProjectCount}</TableCell>
                                    <TableCell className="text-right font-medium">{c.activeTaskCount}</TableCell>
                                    <TableCell className="text-right font-medium">{c.activeTicketCount}</TableCell>
                                    <TableCell className="text-right font-medium">{c.overdueBillCount}</TableCell>
                                </TableRow>
                            ))}
                          </React.Fragment>
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