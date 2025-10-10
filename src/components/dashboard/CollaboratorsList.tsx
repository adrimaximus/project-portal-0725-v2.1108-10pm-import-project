import React, { useState, useMemo, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

interface CollaboratorsListProps {
  projects: Project[];
}

interface CollaboratorStat extends User {
  projectCount: number;
  upcomingProjectCount: number;
  ongoingProjectCount: number;
  activeTaskCount: number;
  activeTicketCount: number;
}

const CollaboratorsList = ({ projects }: CollaboratorsListProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!projects || projects.length === 0) {
        setTasks([]);
        return;
      }
      const projectIds = projects.map(p => p.id);
      const { data, error } = await supabase.rpc('get_project_tasks', { p_project_ids: projectIds });
      
      if (error) {
        console.error("Error fetching project tasks:", error);
        setTasks([]);
      } else {
        setTasks(data || []);
      }
    };

    fetchTasks();
  }, [projects]);

  const collaborators = useMemo(() => {
    const stats: Record<string, CollaboratorStat & { countedProjectIds: Set<string> }> = {};

    const ensureUser = (user: User) => {
        if (!stats[user.id]) {
            stats[user.id] = {
                ...user,
                projectCount: 0,
                upcomingProjectCount: 0,
                ongoingProjectCount: 0,
                activeTaskCount: 0,
                activeTicketCount: 0,
                countedProjectIds: new Set(),
            };
        }
        return stats[user.id];
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    projects.forEach(p => {
        const startDate = p.start_date ? new Date(p.start_date) : null;
        const isUpcoming = startDate ? startDate > today : false;
        const isOngoing = !['Completed', 'Cancelled'].includes(p.status);

        p.assignedTo.forEach(user => {
            const userStat = ensureUser(user);
            if (!userStat.countedProjectIds.has(p.id)) {
                userStat.projectCount++;
                if (isUpcoming) userStat.upcomingProjectCount++;
                if (isOngoing) userStat.ongoingProjectCount++;
                userStat.countedProjectIds.add(p.id);
            }
        });
    });

    tasks.forEach(task => {
        if (!task.completed) {
            task.assignees.forEach((assignee: User) => {
                const userStat = ensureUser(assignee);
                userStat.activeTaskCount++;
                if (task.origin_ticket_id) {
                    userStat.activeTicketCount++;
                }
            });
        }
    });

    return Object.values(stats)
        .map(({ countedProjectIds, ...rest }) => rest)
        .sort((a, b) => b.projectCount - a.projectCount);
  }, [projects, tasks]);

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
                              <TableHead className="text-right">Total Projects</TableHead>
                              <TableHead className="text-right">Upcoming</TableHead>
                              <TableHead className="text-right">On Going</TableHead>
                              <TableHead className="text-right">Active Tasks</TableHead>
                              <TableHead className="text-right">Active Tickets</TableHead>
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
                                  <TableCell className="text-right font-medium">{c.upcomingProjectCount}</TableCell>
                                  <TableCell className="text-right font-medium">{c.ongoingProjectCount}</TableCell>
                                  <TableCell className="text-right font-medium">{c.activeTaskCount}</TableCell>
                                  <TableCell className="text-right font-medium">{c.activeTicketCount}</TableCell>
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