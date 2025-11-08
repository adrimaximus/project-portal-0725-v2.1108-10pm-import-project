import React, { useState, useMemo, useEffect } from 'react';
import { Project, User, PROJECT_STATUS_OPTIONS } from '@/types';
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
import { ChevronsUpDown, Filter } from "lucide-react";
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { useMediaQuery } from '@/hooks/use-media-query';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose, DrawerTrigger } from '../ui/drawer';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';

interface CollaboratorsListProps {
  projects: Project[];
}

const taskFilterOptions = [
  { value: 'created', label: 'Tasks Created' },
  { value: 'active', label: 'Active Tasks' },
  { value: 'overdue', label: 'Overdue Tasks' },
  { value: 'completed', label: 'Completed Tasks' },
];

interface CollaboratorStat extends User {
  projectCount: number;
  projects: {
    id: string;
    name: string;
    isUpcoming: boolean;
    isOnGoing: boolean;
    isActive: boolean;
    status: string;
  }[];
  filteredTaskCount: number;
  projectsForTasks: string[];
  activeTicketCount: number;
  overdueBillCount: number;
  role: string;
}

const CollaboratorsList = ({ projects }: CollaboratorsListProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projectFilters, setProjectFilters] = useState<string[]>(() => {
    return PROJECT_STATUS_OPTIONS
      .map(opt => opt.value)
      .filter(status => !['Completed', 'Cancelled', 'Bid Lost', 'Archived'].includes(status));
  });
  const [taskFilters, setTaskFilters] = useState<string[]>(['active']);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const projectFilterOptions = PROJECT_STATUS_OPTIONS;

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
    const stats: Record<string, CollaboratorStat & { countedProjectIds: Set<string>; matchingTaskIds: Set<string>; matchingTasksDetails: Map<string, string> }> = {};
    const roleHierarchy: Record<string, number> = { 'owner': 1, 'admin': 2, 'editor': 3, 'member': 4 };

    const ensureUser = (user: Partial<User>) => {
        if (!user.id) return null;
        if (!stats[user.id]) {
            stats[user.id] = {
                id: user.id,
                name: user.name || 'Unknown User',
                initials: user.initials || '??',
                avatar_url: user.avatar_url,
                projectCount: 0,
                projects: [],
                filteredTaskCount: 0,
                projectsForTasks: [],
                activeTicketCount: 0,
                overdueBillCount: 0,
                role: user.role || 'member',
                countedProjectIds: new Set(),
                matchingTaskIds: new Set(),
                matchingTasksDetails: new Map(),
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
        
        const paymentDueDate = p.payment_due_date ? new Date(p.payment_due_date) : null;
        const isOverdue = paymentDueDate ? paymentDueDate < today && p.payment_status !== 'Paid' : false;

        p.assignedTo.forEach(user => {
            const userStat = ensureUser(user);
            if (!userStat) return;
            
            const currentRolePriority = roleHierarchy[userStat.role] || 99;
            const newRolePriority = roleHierarchy[user.role || 'member'] || 99;
            if (newRolePriority < currentRolePriority) {
                userStat.role = user.role || 'member';
            }

            if (!userStat.countedProjectIds.has(p.id)) {
                userStat.projectCount++;
                userStat.projects.push({ id: p.id, name: p.name, isUpcoming, isOnGoing, isActive: !['Completed', 'Cancelled', 'Bid Lost'].includes(p.status), status: p.status });
                if (isOverdue) userStat.overdueBillCount++;
                userStat.countedProjectIds.add(p.id);
            }
        });
    });

    const todayForOverdue = new Date();
    todayForOverdue.setHours(23, 59, 59, 999);

    (tasks || []).forEach(task => {
        if (!task.completed && task.origin_ticket_id) {
            (task.assignedTo || []).forEach((assignee: User) => {
                const userStat = ensureUser(assignee);
                if (userStat) userStat.activeTicketCount++;
            });
        }

        const isOverdue = !task.completed && task.due_date && new Date(task.due_date) < todayForOverdue;

        if (taskFilters.includes('created')) {
            const creatorStat = ensureUser(task.created_by);
            if (creatorStat) {
                creatorStat.matchingTaskIds.add(task.id);
                creatorStat.matchingTasksDetails.set(task.project_id, task.project_name);
            }
        }

        (task.assignedTo || []).forEach((assignee: User) => {
            const userStat = ensureUser(assignee);
            if (!userStat) return;

            if (taskFilters.includes('active') && !task.completed) {
                userStat.matchingTaskIds.add(task.id);
                userStat.matchingTasksDetails.set(task.project_id, task.project_name);
            }
            if (taskFilters.includes('overdue') && isOverdue) {
                userStat.matchingTaskIds.add(task.id);
                userStat.matchingTasksDetails.set(task.project_id, task.project_name);
            }
            if (taskFilters.includes('completed') && task.completed) {
                userStat.matchingTaskIds.add(task.id);
                userStat.matchingTasksDetails.set(task.project_id, task.project_name);
            }
        });
    });

    Object.values(stats).forEach(stat => {
        stat.filteredTaskCount = stat.matchingTaskIds.size;
    });

    const collaborators = Object.values(stats)
        .map(({ countedProjectIds, matchingTaskIds, matchingTasksDetails, ...rest }) => ({ 
            ...rest,
            projectsForTasks: Array.from(matchingTasksDetails.values())
        }))
        .sort((a, b) => b.projectCount - a.projectCount);

    const grouped: Record<string, CollaboratorStat[]> = {};
    collaborators.forEach(collab => {
        const role = collab.role || 'member';
        if (!grouped[role]) grouped[role] = [];
        grouped[role].push(collab);
    });

    const orderedGrouped: Record<string, CollaboratorStat[]> = {};
    Object.keys(roleHierarchy).forEach(role => {
        if (grouped[role]) orderedGrouped[role] = grouped[role];
    });
    
    const flatList = Object.values(orderedGrouped).flat();

    return { collaboratorsByRole: orderedGrouped, allCollaborators: flatList };
  }, [projects, tasks, projectFilters, taskFilters]);

  const getFilteredProjects = (collaborator: CollaboratorStat) => {
    if (projectFilters.length === 0) return [];
    return collaborator.projects.filter(p => projectFilters.includes(p.status));
  };

  const handleProjectFilterChange = (filterValue: string) => {
    setProjectFilters(prev => 
      prev.includes(filterValue) 
        ? prev.filter(f => f !== filterValue)
        : [...prev, filterValue]
    );
  };

  const handleTaskFilterChange = (filterValue: string) => {
    setTaskFilters(prev => 
      prev.includes(filterValue) 
        ? prev.filter(f => f !== filterValue)
        : [...prev, filterValue]
    );
  };

  const clearFilters = () => {
    setProjectFilters([]);
    setTaskFilters([]);
  };

  const activeFilterCount = projectFilters.length + taskFilters.length;

  const renderFilteredProjectCount = (collaborator: CollaboratorStat) => {
    const filtered = getFilteredProjects(collaborator);
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{filtered.length}</span>
          </TooltipTrigger>
          <TooltipContent>
            {filtered.length > 0 ? (
              <>
                <p className="font-bold">Filtered Projects:</p>
                <ul className="list-disc pl-4 text-left">
                  {filtered
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(p => <li key={p.id}>{p.name}</li>)}
                </ul>
              </>
            ) : (
              <p>No projects match the current filter.</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderFilteredTaskCount = (collaborator: CollaboratorStat) => {
    const projectNames = [...collaborator.projectsForTasks].sort((a, b) => a.localeCompare(b));

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{collaborator.filteredTaskCount}</span>
          </TooltipTrigger>
          <TooltipContent>
            {projectNames.length > 0 ? (
              <>
                <p className="font-bold">Projects with Filtered Tasks:</p>
                <ul className="list-disc pl-4 text-left">
                  {projectNames.map(name => <li key={name}>{name}</li>)}
                </ul>
              </>
            ) : (
              <p>No tasks match the current filter.</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const FilterContent = (
    <div className="p-1">
      <div className="max-h-[45vh] overflow-y-auto p-3 space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Project Status</h4>
          <div className="space-y-2">
            {projectFilterOptions.map(opt => (
              <div key={opt.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`proj-filter-${opt.value}`}
                  checked={projectFilters.includes(opt.value)}
                  onCheckedChange={() => handleProjectFilterChange(opt.value)}
                />
                <Label htmlFor={`proj-filter-${opt.value}`} className="text-sm font-normal">
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
        <Separator />
        <div>
          <h4 className="font-semibold mb-2">Task Filters</h4>
          <div className="space-y-2">
            {taskFilterOptions.map(opt => (
              <div key={opt.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`task-filter-${opt.value}`}
                  checked={taskFilters.includes(opt.value)}
                  onCheckedChange={() => handleTaskFilterChange(opt.value)}
                />
                <Label htmlFor={`task-filter-${opt.value}`} className="text-sm font-normal">
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const FilterComponent = (
    <div className="flex items-center gap-2">
      {isDesktop ? (
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{activeFilterCount}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="end">
            {FilterContent}
            {activeFilterCount > 0 && (
              <div className="p-4 border-t">
                <Button variant="ghost" size="sm" className="w-full" onClick={clearFilters}>Clear Filters</Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      ) : (
        <Drawer open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{activeFilterCount}</span>
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filters</DrawerTitle>
              <DrawerDescription>Filter collaborator stats by project and task status.</DrawerDescription>
            </DrawerHeader>
            {FilterContent}
            <DrawerFooter>
              {activeFilterCount > 0 && <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>}
              <DrawerClose asChild><Button>Apply</Button></DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );

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
              <div className="flex justify-end mb-4">
                {FilterComponent}
              </div>
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
                            <div className="text-muted-foreground">Filtered Projects</div>
                            <div className="text-right font-medium">{renderFilteredProjectCount(c)}</div>
                            <div className="text-muted-foreground">Filtered Tasks</div>
                            <div className="text-right font-medium">{renderFilteredTaskCount(c)}</div>
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
                            <TableHead className="text-right">Filtered Projects</TableHead>
                            <TableHead className="text-right">Filtered Tasks</TableHead>
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
                                    <TableCell className="text-right font-medium">{renderFilteredProjectCount(c)}</TableCell>
                                    <TableCell className="text-right font-medium">{renderFilteredTaskCount(c)}</TableCell>
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