import { useState, useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Loader2, Clock, CheckCircle2, CheckCircle, AlertTriangle, PlusSquare, ArrowUp, ArrowDown, ListChecks } from 'lucide-react';
import { Task, Project } from '@/types';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { cn, getInitials, getAvatarUrl, generatePastelColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTaskMutations } from '@/hooks/useTaskMutations';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TaskReactions from '@/components/projects/TaskReactions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { useTaskModal } from '@/contexts/TaskModalContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecentActivityWidget from './RecentActivityWidget';
import CollaboratorsTab from './CollaboratorsTab';
import MyTasksWidget from './MyTasksWidget';

const ActivityHubWidget = () => {
  return (
    <Card>
      <Tabs defaultValue="my-tasks" className="w-full">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <TabsList>
            <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="recent-activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
          </TabsList>
          <Button asChild variant="link" className="text-sm -my-2 -mr-4">
            <Link to="/projects?view=tasks">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <TabsContent value="my-tasks" className="mt-0 h-[300px] overflow-y-auto">
            <MyTasksWidget />
          </TabsContent>
          <TabsContent value="recent-activity" className="mt-0 h-[300px] overflow-y-auto">
            <RecentActivityWidget />
          </TabsContent>
          <TabsContent value="collaborators" className="mt-0 h-[300px] overflow-y-auto">
            <CollaboratorsTab />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default ActivityHubWidget;