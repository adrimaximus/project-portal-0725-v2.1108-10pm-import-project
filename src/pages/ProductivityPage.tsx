import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ProductivityPage = () => {
  const location = useLocation();

  // Default to mood-tracker if on /productivity root
  if (location.pathname === '/productivity' || location.pathname === '/productivity/') {
    return <Navigate to="/productivity/mood-tracker" replace />;
  }

  const activeTab = location.pathname.includes('/goals') ? 'goals' : 'mood-tracker';

  return (
    <PortalLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Productivity</h1>
        </div>
        <Tabs value={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:w-[400px]">
            <TabsTrigger value="mood-tracker" asChild>
              <Link to="/productivity/mood-tracker">Mood Tracker</Link>
            </TabsTrigger>
            <TabsTrigger value="goals" asChild>
              <Link to="/productivity/goals">Goals</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="mt-4">
          <Outlet />
        </div>
      </div>
    </PortalLayout>
  );
};

export default ProductivityPage;