import { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecentActivityWidget from './RecentActivityWidget';
import CollaboratorsTab from './CollaboratorsTab';
import MyTasksWidget from './MyTasksWidget';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';
import { ListChecks, Activity, Users, Plus } from 'lucide-react';
import { useTaskModal } from '@/contexts/TaskModalContext';

const ActivityHubWidget = () => {
  const [activeTab, setActiveTab] = useState('my-tasks');
  const { onOpen: onOpenTaskModal } = useTaskModal();

  return (
    <Card>
      <Tabs defaultValue="my-tasks" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4">
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
          <div className="flex items-center gap-2 self-end sm:self-center">
            {activeTab === 'my-tasks' && (
              <Button variant="outline" size="sm" onClick={() => onOpenTaskModal()}>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            )}
            <Button asChild variant="link" className="text-sm">
              <Link to="/projects?view=tasks">View all</Link>
            </Button>
          </div>
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