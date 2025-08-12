import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Package, BarChart, Users, ListChecks, ArrowRight, CalendarCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';

const LandingPage = () => {
  const { session, isLoading: loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, loading, navigate]);

  if (loading) {
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
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Package className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold">Client Portal</span>
        </Link>
        <Button asChild>
          <Link to="/login">Access Portal</Link>
        </Button>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-32">
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
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-background p-8 rounded-lg shadow-sm">
                  <div className="mb-6">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Google Calendar Integration Section */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="md:w-1/2 text-center md:text-left">
                <Badge variant="outline" className="mb-4">Data Transparency</Badge>
                <h2 className="text-3xl md:text-4xl font-bold">Google Calendar Integration</h2>
                <p className="mt-4 text-muted-foreground">
                  To enhance your project management experience, our application offers an optional integration with Google Calendar. This feature helps you visualize your personal and team schedules alongside project deadlines.
                </p>
                <p className="mt-4 text-muted-foreground">
                  <strong>Purpose:</strong> We request access to your Google Calendar to display your events within the project timeline. This allows you to easily identify potential scheduling conflicts and manage your time more effectively.
                </p>
                <p className="mt-4 text-muted-foreground">
                  <strong>Permissions:</strong> We only request <code className="bg-muted px-1 py-0.5 rounded">read-only</code> access (view events on your calendars). Our application cannot create, modify, or delete your events. Your privacy is paramount, and we handle your data in accordance with our <Link to="/privacy-policy" className="text-primary underline">Privacy Policy</Link>.
                </p>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <div className="bg-muted/40 p-8 rounded-lg">
                  <CalendarCheck className="h-24 w-24 text-primary" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-background border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            <span className="text-md font-semibold">Client Portal © {new Date().getFullYear()}</span>
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