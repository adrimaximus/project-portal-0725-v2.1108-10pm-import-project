import { Link } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';

const Index = () => {
  return (
    <PortalLayout>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Welcome</h1>
        <p>This is the main page of your application.</p>
        <Link to="/settings/properties" className="text-blue-500 hover:underline">
          Go to Custom Properties Settings
        </Link>
      </div>
    </PortalLayout>
  );
};

export default Index;