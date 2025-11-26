import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { BarChart, Users, ListChecks, ArrowRight, BrainCircuit, Check, Sparkles, Globe, Smartphone, Palette, Search, Wrench } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { cn } from '@/lib/utils';

const DashboardPreview = () => (
  <div className="relative mt-16 lg:mt-24 group">
    {/* Glow effect behind the dashboard */}
    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
    
    <div className="relative bg-black/40 p-2 sm:p-3 rounded-xl shadow-2xl ring-1 ring-white/10 backdrop-blur-md transition-transform duration-500 hover:scale-[1.01]">
      <div className="bg-[#0F1117]/80 p-2 rounded-lg border border-white/5">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_8px_rgba(234,179,8,0.5)]"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          </div>
          <div className="w-32 h-4 bg-white/5 rounded-full"></div>
        </div>
        <div className="p-2 grid grid-cols-3 gap-4">
          <div className="col-span-1 space-y-3">
            <div className="h-24 bg-white/5 rounded-lg animate-pulse"></div>
            <div className="h-32 bg-white/5 rounded-lg"></div>
          </div>
          <div className="col-span-2 space-y-3">
            <div className="h-32 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg border border-white/5"></div>
            <div className="h-24 bg-white/5 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, isLoading, navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const services = [
    { id: 'web', label: 'Web Development', icon: Globe },
    { id: 'mobile', label: 'Mobile App', icon: Smartphone },
    { id: 'design', label: 'UI/UX Design', icon: Palette },
    { id: 'seo', label: 'SEO Optimization', icon: Search },
    { id: 'consulting', label: 'Consulting', icon: Users },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  ];

  const features = [
    {
      icon: <ListChecks className="h-8 w-8 text-purple-400" />,
      title: 'Project Tracking',
      description: 'Manage every aspect from start to finish. Track tasks and monitor progress in real-time.',
    },
    {
      icon: <BarChart className="h-8 w-8 text-pink-400" />,
      title: 'Actionable Insights',
      description: 'Gain valuable insights with our analytics dashboard. Understand project value and team performance.',
    },
    {
      icon: <Users className="h-8 w-8 text-blue-400" />,
      title: 'Seamless Collaboration',
      description: 'Work together effortlessly. Assign tasks, share files, and keep communication centralized.',
    },
    {
      icon: <BrainCircuit className="h-8 w-8 text-emerald-400" />,
      title: 'Smart AI Agent',
      description: 'Leverage AI to get insights, recall data, and execute tasks through simple conversation.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0D14] text-slate-200 selection:bg-purple-500/30 font-sans">
      {/* Fixed Background Gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-pink-900/10 blur-[100px]"></div>
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0B0D14]/60 backdrop-blur-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-white/10 group-hover:border-purple-500/50 transition-colors">
              <img src="https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/logo.png" alt="7i Portal Logo" className="h-6 w-6 object-contain" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">7i Portal</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Log in
            </Link>
            <Button asChild className="bg-white text-black hover:bg-slate-200 rounded-full px-6">
              <Link to="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <section className="relative py-24 lg:py-32 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-300 mb-8 animate-fade-in-up">
              <Sparkles className="w-3 h-3" />
              <span>The new standard for client portals</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500">
              Your Projects,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Unified & Simplified.</span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-12 leading-relaxed">
              Track progress, collaborate with your team, and get real-time insights from a single, beautiful dashboard designed for modern teams.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Button size="lg" className="h-12 px-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all" asChild>
                <Link to="/login">
                  Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm" onClick={() => document.getElementById('request-service')?.scrollIntoView({ behavior: 'smooth' })}>
                Make a Request
              </Button>
            </div>

            <div className="max-w-5xl mx-auto">
              <DashboardPreview />
            </div>
          </div>
        </section>

        {/* Request Service Segment */}
        <section id="request-service" className="py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent pointer-events-none"></div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What do you need today?</h2>
              <p className="text-slate-400">Select a service to jumpstart your request directly.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto mb-10">
              {services.map((service) => {
                const Icon = service.icon;
                const isSelected = selectedService === service.id;
                return (
                  <div
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    className={cn(
                      "cursor-pointer group relative p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-3 h-32",
                      isSelected 
                        ? "bg-purple-600/20 border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.2)]" 
                        : "bg-[#13151C] border-white/5 hover:border-white/10 hover:bg-[#1A1D26]"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-xl transition-colors duration-300",
                      isSelected ? "bg-purple-600 text-white" : "bg-white/5 text-slate-400 group-hover:text-white group-hover:bg-white/10"
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={cn(
                      "text-sm font-medium text-center",
                      isSelected ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                    )}>
                      {service.label}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-purple-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center">
              <Button 
                size="lg" 
                className={cn(
                  "rounded-full px-10 transition-all duration-500",
                  selectedService 
                    ? "bg-white text-black hover:bg-slate-200 opacity-100 translate-y-0" 
                    : "bg-white/10 text-slate-500 hover:bg-white/10 cursor-not-allowed opacity-50 translate-y-2"
                )}
                disabled={!selectedService}
                asChild={!!selectedService}
              >
                {selectedService ? (
                  <Link to={`/login?service=${selectedService}`}>
                    Continue Request
                  </Link>
                ) : (
                  <span>Select a Service</span>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-black/20 border-t border-white/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
              <div className="max-w-xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                  Everything you need.
                </h2>
                <p className="text-slate-400 text-lg">
                  Powerful features to keep your projects on track and your clients happy.
                </p>
              </div>
              <Button variant="link" className="text-purple-400 hover:text-purple-300 p-0 h-auto gap-1" asChild>
                <Link to="/login">
                  View all features <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="group p-6 rounded-3xl bg-[#13151C] border border-white/5 hover:border-white/10 transition-all duration-300 hover:translate-y-[-4px]">
                  <div className="mb-6 p-3 w-fit rounded-2xl bg-white/5 group-hover:bg-white/10 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-white transition-colors">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0B0D14] border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-white/10 flex items-center justify-center">
                <img src="https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/logo.png" alt="7i Portal Logo" className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-slate-400">© {new Date().getFullYear()} 7i Portal. All rights reserved.</span>
            </div>
            <div className="flex gap-8">
              <Link to="/terms-of-service" className="text-sm text-slate-500 hover:text-white transition-colors">
                Terms
              </Link>
              <Link to="/privacy-policy" className="text-sm text-slate-500 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link to="/login" className="text-sm text-slate-500 hover:text-white transition-colors">
                Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;