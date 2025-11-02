import { useAuth } from '@/contexts/AuthContext';

const WelcomeHeader = () => {
  const { user } = useAuth();
  const userName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="flex items-center justify-between space-y-2">
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Hi, Welcome back {userName} 👋
        </h2>
        <p className="text-muted-foreground">
          Here's an overview of your projects and tasks.
        </p>
      </div>
    </div>
  );
};

export default WelcomeHeader;