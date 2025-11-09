import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecentActivityWidget from './RecentActivityWidget';
import CollaboratorsTab from './CollaboratorsTab';
import MyTasksTab from './MyTasksTab';

const ActivityHubWidget = ({ projects }: { projects: Project[] }) => {
  return (
    <Card>
      <Tabs defaultValue="recent-activity" className="w-full">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <TabsList>
            <TabsTrigger value="recent-activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
          </TabsList>
          <Button asChild variant="link" className="text-sm -my-2 -mr-4">
            <Link to="/projects?view=tasks">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <TabsContent value="recent-activity" className="mt-0">
            <RecentActivityWidget />
          </TabsContent>
          <TabsContent value="my-tasks" className="mt-0">
            <MyTasksTab />
          </TabsContent>
          <TabsContent value="collaborators" className="mt-0">
            <CollaboratorsTab projects={projects} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default ActivityHubWidget;