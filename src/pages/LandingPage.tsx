import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { Package, BarChart, Users, ListChecks, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Jika status otentikasi tidak lagi dimuat dan ada sesi,
    // arahkan pengguna ke dasbor.
    if (!loading && session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, loading, navigate]);

  // Selama status otentikasi sedang diperiksa, tampilkan layar pemuatan.
  // Ini mencegah halaman utama "berkedip" sebelum pengalihan.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-muted-foreground">Authenticating...</p>
      </div>
    );
  }

  // Jika tidak ada sesi setelah pemeriksaan, tampilkan halaman utama.
  const features = [
    {
      icon: <ListChecks className="h-10 w-10 text-primary" />,
      title: 'Comprehensive Project Tracking',
      description: 'Monitor project status, progress, and deadlines all in one place. Never miss a beat.',
    },
    {
      icon: <BarChart className="h-10 w-10 text-primary" />,
      title: 'Actionable Insights',
      description: 'Gain valuable insights with our analytics dashboard. Understand project value, team performance, and more.',
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: 'Seamless Collaboration',
      description: 'Work together with your team effortlessly. See who is working on what and keep communication flowing.',
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
      </main>

      <footer className="bg-background border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            <span className="text-md font-semibold">Client Portal</span>
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