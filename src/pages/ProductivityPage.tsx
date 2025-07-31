import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ProductivityPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect dari /productivity ke sub-halaman default
  if (location.pathname === '/productivity' || location.pathname === '/productivity/') {
    return <Navigate to="/productivity/mood-tracker" replace />;
  }

  const activeTab = location.pathname.split('/').pop() || 'mood-tracker';

  const handleTabChange = (value: string) => {
    navigate(`/productivity/${value}`);
  };

  return (
    <div className="flex flex-col h-full py-6">
      <div className="px-6">
        <h1 className="text-2xl font-semibold mb-4">Productivity</h1>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="mood-tracker">Mood Tracker</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="mt-6 px-6">
        <Outlet />
      </div>
    </div>
  );
};

export default ProductivityPage;