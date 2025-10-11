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
  overdueBillCount: number;
  role: string;
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

  const { collaboratorsByRole, allCollaborators } = useMemo(() => {
    const stats: Record<string, CollaboratorStat & { countedProjectIds: Set<string> }> = {};
    const roleHierarchy: Record<string, number> = { 'owner': 1, 'admin': 2, 'editor': 3, 'member': 4 };

    const ensureUser = (user: User) => {
        if (!stats[user.id]) {
            stats[user.id] = {
                ...user,
                projectCount: 0,
                upcomingProjectCount: 0,
                ongoingProjectCount: 0,
                activeTaskCount: 0,
                activeTicketCount: 0,
                overdueBillCount: 0,
                role: user.role || 'member',
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
        
        const paymentDueDate = p.payment_due_date ? new Date(p.payment_due_date) : null;
        const isOverdue = paymentDueDate ? paymentDueDate < today && p.payment_status !== 'Paid' : false;

        p.assignedTo.forEach(user => {
            const userStat = ensureUser(user);
            
            const currentRolePriority = roleHierarchy[userStat.role] || 99;
            const newRolePriority = roleHierarchy[user.role || 'member'] || 99;
            if (newRolePriority < currentRolePriority) {
                userStat.role = user.role || 'member';
            }

            if (!userStat.countedProjectIds.has(p.id)) {
                userStat.projectCount++;
                if (isUpcoming) userStat.upcomingProjectCount++;
                if (isOngoing) userStat.ongoingProjectCount++;
                if (isOverdue) userStat.overdueBillCount++;
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

    const collaborators = Object.values(stats)
        .map(({ countedProjectIds, ...rest }) => rest)
        .sort((a, b) => b.projectCount - a.projectCount);

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
            orderedGrouped[role] = grouped[role];
        }
    });
    
    const flatList = Object.values(orderedGrouped).flat();

    return { collaboratorsByRole: orderedGrouped, allCollaborators: flatList };
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