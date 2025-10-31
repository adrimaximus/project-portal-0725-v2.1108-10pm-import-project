import React, { useState, useMemo } from 'react';
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
import { ChevronsUpDown, ChevronDown, Users, Briefcase, Hourglass, ListChecks, Ticket, CreditCard, ArrowUpDown } from "lucide-react";
import { generatePastelColor, getAvatarUrl } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCollaboratorStats, CollaboratorStat } from '@/hooks/useCollaboratorStats';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

type SortField = 'name' | 'project_count' | 'ongoing_project_count' | 'upcoming_project_count' | 'active_task_count' | 'overdue_bill_count';

const capitalizeWords = (str: string) => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const CollaboratorsList = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'ongoing' | 'upcoming'>('ongoing');
  const [sortField, setSortField] = useState<SortField>('project_count');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { data: collaborators = [], isLoading } = useCollaboratorStats();
  const { data: dashboardStats, isLoading: isLoadingStats } = useDashboardStats();

  const filterLabels = {
    ongoing: 'Ongoing Projects',
    upcoming: 'Upcoming Projects',
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const { groupedAndSortedCollaborators, allCollaborators, sortedCollaborators } = useMemo(() => {
    // Define role hierarchy including new roles
    const roleHierarchy: Record<string, number> = { 
      'master admin': 0, 
      'admin': 1, 
      'project executive': 2, // Added
      'project admin': 3,     // Added
      'BD': 4,
      'owner': 5, 
      'editor': 6, 
      'creative': 7,          // Added
      'member': 8, 
      'client': 9 
    };
    
    const grouped: Record<string, CollaboratorStat[]> = {};
    collaborators.forEach(collab => {
        // Ensure role is lowercased for consistent grouping/hierarchy lookup
        const role = collab.role ? collab.role.toLowerCase() : 'member';
        if (!grouped[role]) {
            grouped[role] = [];
        }
        grouped[role].push(collab);
    });

    const flatList = Object.values(grouped).flat();

    // Function to sort members within a group or the flat list
    const sortMembers = (members: CollaboratorStat[]) => {
        return [...members].sort((a, b) => {
            let aValue: any = a[sortField];
            let bValue: any = b[sortField];

            if (sortField === 'name') {
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                return sortDirection === 'asc' 
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            // Numeric sorting
            const numA = Number(aValue) || 0;
            const numB = Number(bValue) || 0;
            return sortDirection === 'asc' ? numA - numB : numB - numA;
        });
    };

    // 1. Get role keys and sort them by hierarchy
    const roleKeys = Object.keys(grouped).sort((a, b) => (roleHierarchy[a] ?? 99) - (roleHierarchy[b] ?? 99));

    // 2. Create the strictly grouped and sorted structure (for desktop view)
    const groupedAndSorted: { roleName: string, members: CollaboratorStat[] }[] = roleKeys.map(role => ({
        roleName: role,
        members: sortMembers(grouped[role]!) // Sort members within each role group
    }));
    
    // 3. Create the fully flat sorted list (for mobile view)
    const sortedCollaborators = sortMembers(flatList);


    return { 
      groupedAndSortedCollaborators: groupedAndSorted, 
      allCollaborators: flatList,
      sortedCollaborators: sortedCollaborators
    };
  }, [collaborators, sortField, sortDirection]);

  const getFilteredCount = (collaborator: CollaboratorStat) => {
    switch (filter) {
      case 'upcoming':
        return collaborator.upcoming_project_count;
      case 'ongoing':
      default:
        return collaborator.ongoing_project_count;
    }
  };

  return (
    <Card>
      <TooltipProvider>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="w-full p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle>Collaborators</CardTitle>
                <Badge variant="secondary">{allCollaborators.length}</Badge>
              </div>
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
                    {allCollaborators.length > 5 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium">
                        +{allCollaborators.length - 5}
                      </div>
                    )}
                  </div>
                )}
                <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="px-6 pb-6 pt-0">
              {isLoading || isLoadingStats ? (
                <div className="text-center text-muted-foreground py-8">Loading collaborators...</div>
              ) : allCollaborators.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Users className="mx-auto h-12 w-12" />
                  <p className="mt-4 font-semibold">No collaborators found.</p>
                  <p className="text-sm">Start a project or get invited to one to see your team here.</p>
                </div>
              ) : (
                <>
                  {/* Summary Stats - Using actual app statistics */}
                  {dashboardStats && (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{dashboardStats.totalProjects}</p>
                        <p className="text-xs text-muted-foreground">Total Projects</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{dashboardStats.ongoingProjects}</p>
                        <p className="text-xs text-muted-foreground">Ongoing</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{dashboardStats.upcomingProjects}</p>
                        <p className="text-xs text-muted-foreground">Upcoming</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{dashboardStats.activeTasks}</p>
                        <p className="text-xs text-muted-foreground">Active Tasks</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{dashboardStats.activeTickets}</p>
                        <p className="text-xs text-muted-foreground">Tickets</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-destructive">{dashboardStats.overdueBills}</p>
                        <p className="text-xs text-muted-foreground">Overdue Bills</p>
                      </div>
                    </div>
                  )}

                  {/* Mobile View */}
                  <div className="md:hidden">
                    <div className="flex justify-between items-center mb-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <ArrowUpDown className="mr-2 h-4 w-4" />
                            Sort
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onSelect={() => handleSort('name')}>Name</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleSort('project_count')}>Total Projects</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleSort('ongoing_project_count')}>Ongoing</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleSort('active_task_count')}>Tasks</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            {filterLabels[filter]}
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setFilter('ongoing')}>Ongoing Projects</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setFilter('upcoming')}>Upcoming Projects</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="space-y-4">
                      {/* Use sortedCollaborators for mobile view */}
                      {sortedCollaborators.map(c => (
                        <div key={c.id} className="bg-muted/50 p-4 rounded-lg">
                          <Link to={c.slug ? `/people/${c.slug}` : `/users/${c.id}`} className="flex items-center gap-3 mb-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={getAvatarUrl(c.avatar_url, c.id)} alt={c.name} />
                              <AvatarFallback style={generatePastelColor(c.id)}>{c.initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <span className="font-medium block">{c.name}</span>
                              <Badge variant="outline" className="text-xs capitalize mt-1">{capitalizeWords(c.role)}</Badge>
                            </div>
                          </Link>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-2 text-muted-foreground"><Briefcase className="h-4 w-4" /> Total</span>
                              <span className="font-medium">{c.project_count}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-2 text-muted-foreground"><Hourglass className="h-4 w-4" /> {filter === 'ongoing' ? 'Ongoing' : 'Upcoming'}</span>
                              <span className="font-medium">{getFilteredCount(c)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-2 text-muted-foreground"><ListChecks className="h-4 w-4" /> Tasks</span>
                              <span className="font-medium">{c.active_task_count}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-2 text-muted-foreground"><Ticket className="h-4 w-4" /> Tickets</span>
                              <span className="font-medium">{c.active_ticket_count}</span>
                            </div>
                            {c.overdue_bill_count > 0 && (
                              <div className="col-span-2 flex justify-between items-center bg-destructive/10 p-2 rounded">
                                <span className="flex items-center gap-2 text-destructive"><CreditCard className="h-4 w-4" /> Overdue Bills</span>
                                <span className="font-bold text-destructive">{c.overdue_bill_count}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                  <Button variant="ghost" onClick={() => handleSort('name')} className="px-2 h-8">
                                    Collaborator
                                    {sortField === 'name' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                  </Button>
                                </TableHead>
                                <TableHead className="text-right">
                                  <Button variant="ghost" onClick={() => handleSort('project_count')} className="px-2 h-8">
                                    Total Projects
                                    {sortField === 'project_count' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                  </Button>
                                </TableHead>
                                <TableHead className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="px-2 h-8">
                                        {filterLabels[filter]}
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onSelect={() => setFilter('ongoing')}>Ongoing Projects</DropdownMenuItem>
                                      <DropdownMenuItem onSelect={() => setFilter('upcoming')}>Upcoming Projects</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableHead>
                                <TableHead className="text-right">
                                  <Button variant="ghost" onClick={() => handleSort('active_task_count')} className="px-2 h-8">
                                    Active Work
                                    {sortField === 'active_task_count' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                  </Button>
                                </TableHead>
                                <TableHead className="text-right">
                                  <Button variant="ghost" onClick={() => handleSort('overdue_bill_count')} className="px-2 h-8">
                                    Overdue Bills
                                    {sortField === 'overdue_bill_count' && <ArrowUpDown className="ml-2 h-4 w-4" />}
                                  </Button>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Iterate over grouped and sorted roles */}
                            {groupedAndSortedCollaborators.map(group => (
                                <React.Fragment key={group.roleName}>
                                    <TableRow className="border-b-0 hover:bg-transparent">
                                        <TableCell colSpan={5} className="pt-6 pb-2">
                                            <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
                                                {capitalizeWords(group.roleName)}
                                            </h3>
                                        </TableCell>
                                    </TableRow>
                                    {group.members.map(c => {
                                        const ticketPercentage = c.active_task_count > 0 ? (c.active_ticket_count / c.active_task_count) * 100 : 0;
                                        const nonTicketTasks = c.active_task_count - c.active_ticket_count;
                                        
                                        return (
                                            <TableRow key={c.id}>
                                                <TableCell>
                                                    <Link to={c.slug ? `/people/${c.slug}` : `/users/${c.id}`} className="flex items-center gap-3 hover:underline">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={getAvatarUrl(c.avatar_url, c.id)} alt={c.name} />
                                                            <AvatarFallback style={generatePastelColor(c.id)}>{c.initials}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium whitespace-nowrap">{c.name}</span>
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">{c.project_count}</TableCell>
                                                <TableCell className="text-right font-medium">{getFilteredCount(c)}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                  <TooltipProvider>
                                                    <Tooltip>
                                                      <TooltipTrigger asChild>
                                                        <div className="flex items-center justify-end gap-2">
                                                          <span>{c.active_task_count}</span>
                                                          {c.active_task_count > 0 && (
                                                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden flex">
                                                              <div style={{ width: `${ticketPercentage}%` }} className="bg-destructive h-full"></div>
                                                            </div>
                                                          )}
                                                        </div>
                                                      </TooltipTrigger>
                                                      <TooltipContent>
                                                        <p>{c.active_ticket_count} ticket(s)</p>
                                                        <p>{nonTicketTasks} other task(s)</p>
                                                      </TooltipContent>
                                                    </Tooltip>
                                                  </TooltipProvider>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                  {c.overdue_bill_count > 0 ? (
                                                    <span className="font-bold text-destructive">{c.overdue_bill_count}</span>
                                                  ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                  )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </TooltipProvider>
    </Card>
  );
};

export default CollaboratorsList;