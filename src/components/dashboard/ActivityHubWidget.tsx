import { useState, useMemo, useEffect } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Loader2, Clock, CheckCircle2, CheckCircle, AlertTriangle, PlusSquare, ArrowUp, ArrowDown, ListChecks, Activity, Users } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecentActivityWidget from './RecentActivityWidget';
import CollaboratorsTab from './CollaboratorsTab';
import MyTasksWidget from './MyTasksWidget';

const ActivityHubWidget = () => {
  return (
    <Card>
      <Tabs defaultValue="my-tasks" className="w-full">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pb-4">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
            <TabsTrigger value="my-tasks">
              <ListChecks className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">My Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="recent-activity">
              <Activity className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Recent Activity</span>
            </TabsTrigger>
            <TabsTrigger value="collaborators">
              <Users className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Collaborators</span>
            </TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent>
          <TabsContent value="my-tasks" className="mt-0">
            <MyTasksWidget />
          </TabsContent>
          <TabsContent value="recent-activity" className="mt-0">
            <RecentActivityWidget />
          </TabsContent>
          <TabsContent value="collaborators" className="mt-0">
            <CollaboratorsTab />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default ActivityHubWidget;