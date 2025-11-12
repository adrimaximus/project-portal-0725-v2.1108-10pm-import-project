import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronsUpDown, ArrowUp, ArrowDown, ListChecks, CheckCircle, AlertTriangle, PlusSquare } from "lucide-react";
import { generatePastelColor, getAvatarUrl, cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { useMediaQuery } from '@/hooks/use-media-query';
import { Progress } from '@/components/ui/progress';
import { useCollaboratorStats, CollaboratorStat } from '@/hooks/useCollaboratorStats';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const CollaboratorsTab = () => {
  const { data: collaborators, isLoading } = useCollaboratorStats();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' }>({ key: 'project_count', direction: 'descending' });
  const { user: currentUser } = useAuth();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'descending';
    if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };

  const collaboratorsWithMetrics = useMemo(() => {
    if (!collaborators) return [];
    return collaborators.map(c => {
      const completionRate = c.assigned_task_count > 0 ? (c.completed_assigned_task_count / c.assigned_task_count) * 100 : 0;
      const onTimeRate = c.completed_assigned_task_count > 0 ? (c.completed_on_time_count / c.completed_assigned_task_count) * 100 : 0;
      const createdCompletionRate = c.created_task_count > 0 ? (c.completed_created_task_count / c.created_task_count) * 100 : 0;
      return { ...c, completionRate, onTimeRate, createdCompletionRate };
    });
  }, [collaborators]);

  const sortedCollaborators = useMemo(() => {
    const sorted = [...collaboratorsWithMetrics].sort((a, b) => {
      const key = sortConfig.key as keyof typeof a;
      const aValue = a[key];
      const bValue = b[key];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    if (currentUser) {
      const currentUserIndex = sorted.findIndex(c => c.id === currentUser.id);
      if (currentUserIndex > 0) {
        const [currentUserData] = sorted.splice(currentUserIndex, 1);
        sorted.unshift(currentUserData);
      }
    }
    return sorted;
  }, [collaboratorsWithMetrics, sortConfig, currentUser]);

  const renderCompletionRate = (c: typeof sortedCollaborators[0]) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-end gap-2">
            <span>{c.completionRate.toFixed(0)}%</span>
            <Progress value={c.completionRate} className="w-16 h-1.5" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2 text-sm">
            <p className="font-bold">Task Productivity</p>
            <div className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-blue-500" /><div><p><strong>{c.completionRate.toFixed(0)}%</strong> Overall Completion</p><p className="text-xs text-muted-foreground">{c.completed_assigned_task_count} of {c.assigned_task_count} assigned</p></div></div>
            <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /><div><p><strong>{c.onTimeRate.toFixed(0)}%</strong> On-Time Completion</p><p className="text-xs text-muted-foreground">{c.completed_on_time_count} of {c.completed_assigned_task_count} completed</p></div></div>
            <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /><div><p><strong>{c.overdue_task_count}</strong> Overdue Task(s)</p></div></div>
            <div className="flex items-center gap-2"><PlusSquare className="h-4 w-4 text-blue-500" /><div><p><strong>{c.createdCompletionRate.toFixed(0)}%</strong> Created Tasks Done</p><p className="text-xs text-muted-foreground">{c.completed_created_task_count} of {c.created_task_count} created</p></div></div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const SortableTableHead = ({ children, columnKey }: { children: React.ReactNode, columnKey: string }) => {
    const isActive = sortConfig.key === columnKey;
    const Icon = isActive ? (sortConfig.direction === 'ascending' ? ArrowUp : ArrowDown) : ChevronsUpDown;
    return (
      <TableHead className="text-right">
        <Button variant="ghost" onClick={() => handleSort(columnKey)} className="px-2 py-1 h-auto -mx-2">
          <span className="mr-2">{children}</span>
          <Icon className={cn("h-4 w-4", !isActive && "text-muted-foreground/50")} />
        </Button>
      </TableHead>
    );
  };

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">Loading stats...</div>;

  return (
    <div>
      {isDesktop ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Collaborator</TableHead>
              <SortableTableHead columnKey="project_count">Projects</SortableTableHead>
              <SortableTableHead columnKey="active_task_count">Active Tasks</SortableTableHead>
              <SortableTableHead columnKey="completionRate">Completion</SortableTableHead>
              <SortableTableHead columnKey="overdue_task_count">Overdue</SortableTableHead>
              <SortableTableHead columnKey="overdue_bill_count">Overdue Bill</SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCollaborators.map(c => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8"><AvatarImage src={getAvatarUrl(c.avatar_url, c.id)} alt={c.name} /><AvatarFallback style={generatePastelColor(c.id)}>{c.initials}</AvatarFallback></Avatar>
                    <span className="font-medium whitespace-nowrap">{c.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">{c.project_count}</TableCell>
                <TableCell className="text-right font-medium">{c.active_task_count}</TableCell>
                <TableCell className="text-right font-medium">{renderCompletionRate(c)}</TableCell>
                <TableCell className="text-right font-medium">{c.overdue_task_count}</TableCell>
                <TableCell className="text-right font-medium">{c.overdue_bill_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="space-y-4">
          {sortedCollaborators.map(c => (
            <div key={c.id} className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10"><AvatarImage src={getAvatarUrl(c.avatar_url, c.id)} alt={c.name} /><AvatarFallback style={generatePastelColor(c.id)}>{c.initials}</AvatarFallback></Avatar>
                <span className="font-medium">{c.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-muted-foreground">Projects</div><div className="text-right font-medium">{c.project_count}</div>
                <div className="text-muted-foreground">Active Tasks</div><div className="text-right font-medium">{c.active_task_count}</div>
                <div className="text-muted-foreground">Completion</div><div className="text-right font-medium">{renderCompletionRate(c)}</div>
                <div className="text-muted-foreground">Overdue Tasks</div><div className="text-right font-medium">{c.overdue_task_count}</div>
                <div className="text-muted-foreground">Overdue Bill</div><div className="text-right font-medium">{c.overdue_bill_count}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollaboratorsTab;