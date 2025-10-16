import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { BarChart, Users, ListChecks, ArrowRight, BrainCircuit } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

const DashboardPreview = () => (
  <div className="relative mt-12 lg:mt-16">
    <div className="absolute -bottom-8 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent z-10"></div>
    <div className="bg-muted/50 p-2 sm:p-4 rounded-xl shadow-2xl ring-1 ring-black/5 backdrop-blur-sm">
      <div className="bg-background/80 p-2 rounded-lg">
        <div className="flex items-center justify-between px-2 py-1 border-b">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
          </div>
          <div className="w-1/2 h-4 bg-muted rounded-md"></div>
        </div>
        <div className="p-2 sm:p-4 grid grid-cols-3 gap-2 sm:gap-4">
          <div className="col-span-1 space-y-2 sm:space-y-4">
            <div className="h-16 sm:h-20 bg-muted rounded-lg"></div>
            <div className="h-24 sm:h-32 bg-muted rounded-lg"></div>
          </div>
          <div className="col-span-2 space-y-2 sm:space-y-4">
            <div className="h-24 sm:h-32 bg-muted rounded-lg"></div>
            <div className="h-16 sm:h-20 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, isLoading, navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const features = [
    {
      icon: <ListChecks className="h-10 w-10 text-primary" />,
      title: 'Comprehensive Project Tracking',
      description: 'Manage every aspect of your projects from start to finish. Track tasks, monitor progress in real-time, and ensure deadlines are met with our intuitive interface.',
    },
    {
      icon: <BarChart className="h-10 w-10 text-primary" />,
      title: 'Actionable Insights',
      description: 'Gain valuable insights with our analytics dashboard. Understand project value, team performance, and identify bottlenecks before they become problems.',
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: 'Seamless Collaboration',
      description: 'Work together with your team and clients effortlessly. Assign tasks, share files, and keep all project-related communication centralized and organized.',
    },
    {
      icon: <BrainCircuit className="h-10 w-10 text-primary" />,
      title: 'Smart AI Agent',
      description: 'Leverage our smart AI to get insights, recall data, and execute tasks like creating projects, updating goals, and more—all through simple conversation.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/logo.png" alt="7i Portal Logo" className="h-8 w-8" />
          <span className="text-xl font-bold">7i Portal</span>
        </Link>
        <Button asChild>
          <Link to="/login">Access Portal</Link>
        </Button>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 md:py-24 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter mb-6">
              Your Projects, Simplified.
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground mb-10">
              Welcome to your dedicated client portal. Track progress, collaborate with your team, and get real-time insights on all your projects from a single, unified dashboard.
            </p>
            <Button size="lg" asChild>
              <Link to="/login">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <DashboardPreview />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28 bg-muted/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold">Key Features</h2>
              <p className="max-w-2xl mx-auto mt-4 text-muted-foreground">
                Everything you need to stay on top of your client work.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-background p-8 rounded-lg shadow-sm flex flex-col">
                  <div className="mb-6">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground flex-grow">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-background border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/logo.png" alt="7i Portal Logo" className="h-6 w-6" />
            <span className="text-md font-semibold">7i Portal © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Link to="/terms-of-service" className="text-sm text-muted-foreground hover:text-primary">
              Terms of Service
            </Link>
            <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;