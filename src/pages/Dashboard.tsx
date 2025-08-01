import { dummyProjects } from '@/data/projects';
import PortalLayout from '@/components/PortalLayout';

const Dashboard = () => {
  return (
    <PortalLayout>
      <h1>Dashboard</h1>
      <p>Total projects: {dummyProjects.length}</p>
    </PortalLayout>
  );
};

export default Dashboard;