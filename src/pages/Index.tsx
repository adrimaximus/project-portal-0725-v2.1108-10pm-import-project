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
      <MyTasksWidget />
      <RecentProjectsWidget projects={projects} />
    </div>
  );
};

export default Index;