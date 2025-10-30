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
import { ChevronsUpDown, ChevronDown, Users } from "lucide-react";
import { generatePastelColor, getAvatarUrl, safeFormatDistanceToNow } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCollaboratorStats, CollaboratorStat } from '@/hooks/useCollaboratorStats';

const CollaboratorsList = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'ongoing' | 'upcoming'>('ongoing');
  const { data: collaborators = [], isLoading } = useCollaboratorStats();

  const filterLabels = {
    ongoing: 'Ongoing Projects',
    upcoming: 'Upcoming Projects',
  };

  const { collaboratorsByRole, allCollaborators } = useMemo(() => {
    const roleHierarchy: Record<string, number> = { 'master admin': 0, 'admin': 1, 'owner': 2, 'editor': 3, 'member': 4, 'client': 5 };
    
    const grouped: Record<string, CollaboratorStat[]> = {};
    collaborators.forEach(collab => {
        const role = collab.role || 'member';
        if (!grouped[role]) {
            grouped[role] = [];
        }
        grouped[role].push(collab);
    });

    const orderedGrouped: Record<string, CollaboratorStat[]> = {};
    Object.keys(grouped).sort((a, b) => (roleHierarchy[a] ?? 99) - (roleHierarchy[b] ?? 99)).forEach(role => {
        if (grouped[role]) {
            orderedGrouped[role] = grouped[role].sort((a, b) => a.name.localeCompare(b.name));
        }
    });
    
    const flatList = Object.values(orderedGrouped).flat();

    return { collaboratorsByRole: orderedGrouped, allCollaborators: flatList };
  }, [collaborators]);

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
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">Loading collaborators...</div>
              ) : allCollaborators.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Users className="mx-auto h-12 w-12" />
                  <p className="mt-4 font-semibold">No collaborators found.</p>
                  <p className="text-sm">Start a project or get invited to one to see your team here.</p>
                </div>
              ) : (
                <>
                  {/* Mobile View */}
                  <div className="md:hidden">
                    <div className="flex justify-end mb-4">
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
                                <div className="text-right font-medium">{c.project_count}</div>
                                <div className="text-muted-foreground">{filterLabels[filter]}</div>
                                <div className="text-right font-medium">{getFilteredCount(c)}</div>
                                <div className="text-muted-foreground">Active Tasks</div>
                                <div className="text-right font-medium">{c.active_task_count}</div>
                                <div className="text-muted-foreground">Active Tickets</div>
                                <div className="text-right font-medium">{c.active_ticket_count}</div>
                                <div className="text-muted-foreground">Overdue Bill</div>
                                <div className="text-right font-medium">{c.overdue_bill_count}</div>
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
                                        <TableCell className="text-right font-medium">{c.project_count}</TableCell>
                                        <TableCell className="text-right font-medium">{getFilteredCount(c)}</TableCell>
                                        <TableCell className="text-right font-medium">{c.active_task_count}</TableCell>
                                        <TableCell className="text-right font-medium">{c.active_ticket_count}</TableCell>
                                        <TableCell className="text-right font-medium">{c.overdue_bill_count}</TableCell>
                                    </TableRow>
                                ))}
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