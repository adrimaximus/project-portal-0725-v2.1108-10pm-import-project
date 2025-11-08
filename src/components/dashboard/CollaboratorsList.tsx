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
import { ChevronsUpDown, ChevronDown, Check } from "lucide-react";
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';

interface CollaboratorsListProps {
  projects: Project[];
}

interface CollaboratorStat extends User {
  projectCount: number;
  projects: {
    id: string;
    isUpcoming: boolean;
    isOnGoing: boolean;
    isActive: boolean;
  }[];
  activeTaskCount: number;
  activeTicketCount: number;
  overdueBillCount: number;
  role: string;
}

const CollaboratorsList = ({ projects }: CollaboratorsListProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [filters, setFilters] = useState<string[]>(['activeProject']);

  const filterOptions = [
    { value: 'activeProject', label: 'Active Projects' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'onGoing', label: 'On Going' },
  ];

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
                projects: [],
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
        const endDate = p.due_date ? new Date(p.due_date) : null;

        const isUpcoming = startDate ? startDate > today : false;
        const isOnGoing = startDate ? (startDate <= today && (endDate ? endDate >= today : true)) : false;
        const isActive = !['Completed', 'Cancelled', 'Bid Lost'].includes(p.status);
        
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
                userStat.projects.push({ id: p.id, isUpcoming, isOnGoing, isActive });
                if (isOverdue) userStat.overdueBillCount++;
                userStat.countedProjectIds.add(p.id);
            }
        });
    });

    (tasks || []).forEach(task => {
        if (!task.completed) {
            (task.assignedTo || []).forEach((assignee: User) => {
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

  const getFilteredCount = (collaborator: CollaboratorStat) => {
    if (filters.length === 0) return 0;
    const matchingProjectIds = new Set<string>();
    collaborator.projects.forEach(p => {
        if (
            (filters.includes('activeProject') && p.isActive) ||
            (filters.includes('upcoming') && p.isUpcoming) ||
            (filters.includes('onGoing') && p.isOnGoing)
        ) {
            matchingProjectIds.add(p.id);
        }
    });
    return matchingProjectIds.size;
  };

  const handleFilterChange = (filterValue: string) => {
    setFilters(prev => 
      prev.includes(filterValue) 
        ? prev.filter(f => f !== filterValue)
        : [...prev, filterValue]
    );
  };

  const filterButtonText = useMemo(() => {
    if (filters.length === 0) return "No filters selected";
    if (filters.length === 1) {
      return filterOptions.find(f => f.value === filters[0])?.label || "Filter";
    }
    return `${filters.length} filters selected`;
  }, [filters]);

  return (
    <Card className="mb-24">
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
                <div className="flex justify-end mb-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {filterButtonText}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {filterOptions.map(opt => (
                        <DropdownMenuCheckboxItem
                          key={opt.value}
                          checked={filters.includes(opt.value)}
                          onCheckedChange={() => handleFilterChange(opt.value)}
                        >
                          {opt.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
                            <div className="text-muted-foreground">{filterButtonText}</div>
                            <div className="text-right font-medium">{getFilteredCount(c)}</div>
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
                            <TableHead className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="px-2 -mr-2 h-8">
                                    {filterButtonText}
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {filterOptions.map(opt => (
                                    <DropdownMenuCheckboxItem
                                      key={opt.value}
                                      checked={filters.includes(opt.value)}
                                      onCheckedChange={() => handleFilterChange(opt.value)}
                                    >
                                      {opt.label}
                                    </DropdownMenuCheckboxItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableHead>
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
                                    <TableCell className="text-right font-medium">{getFilteredCount(c)}</TableCell>
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