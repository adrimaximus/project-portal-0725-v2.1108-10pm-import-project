import { useProjects } from '@/hooks/useProjects';
import { Loader2 } from 'lucide-react';
import WelcomeHeader from '@/components/dashboard/WelcomeHeader';
import DashboardStatsGrid from '@/components/dashboard/DashboardStatsGrid';
import RecentProjectsWidget from '@/components/dashboard/RecentProjectsWidget';
import MyTasksWidget from '@/components/dashboard/MyTasksWidget';

const Index = () => {
  const { data: projects, isLoading } = useProjects();

  if (isLoading || !projects) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <WelcomeHeader />
      <DashboardStatsGrid projects={projects} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentProjectsWidget projects={projects} />
        </div>
        <div className="lg:col-span-1">
          <MyTasksWidget />
        </div>
      </div>
    </div>
  );
};

export default Index;