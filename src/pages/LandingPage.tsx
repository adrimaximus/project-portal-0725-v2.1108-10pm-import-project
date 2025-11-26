import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { 
  BarChart, Users, ListChecks, ArrowRight, BrainCircuit, Check, 
  Sparkles, Globe, Smartphone, Palette, Search, Wrench, 
  CreditCard, MessageSquare, BookOpen, Bell, Shield, Zap,
  LayoutGrid, Target, Megaphone, Receipt, Database
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { supabase } from "@/integrations/supabase/client";
import { getIconComponent } from "@/data/icons";
import { Badge } from "@/components/ui/badge";
import { Service } from "@/types";
import { Input } from "@/components/ui/input";

// Dashboard Preview Component with enhanced styling
const DashboardPreview = () => (
  <motion.div 
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    className="relative mt-16 lg:mt-24 group"
  >
    {/* Glow effect behind the dashboard */}
    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 rounded-2xl blur-3xl opacity-20 group-hover:opacity-30 transition duration-1000"></div>
    
    <div className="relative bg-[#0F1117]/90 p-2 sm:p-3 rounded-xl shadow-2xl ring-1 ring-white/10 backdrop-blur-xl transition-transform duration-500 hover:scale-[1.01]">
      <div className="bg-[#0B0D14] p-3 rounded-lg border border-white/5 overflow-hidden">
        {/* Fake Window Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-white/5 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]"></div>
            <div className="w-3 h-3 rounded-full bg-[#28C840]"></div>
          </div>
          <div className="flex gap-4">
             <div className="w-24 h-2 bg-white/5 rounded-full"></div>
             <div className="w-16 h-2 bg-white/5 rounded-full"></div>
          </div>
        </div>
        
        {/* Fake Dashboard UI */}
        <div className="grid grid-cols-4 gap-4 p-2">
            {/* Sidebar */}
            <div className="col-span-1 hidden md:block space-y-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-8 w-full bg-white/5 rounded-md flex items-center px-2 gap-2">
                        <div className="w-4 h-4 bg-white/10 rounded-sm"></div>
                        <div className="w-16 h-2 bg-white/10 rounded-full"></div>
                    </div>
                ))}
            </div>
            
            {/* Main Content */}
            <div className="col-span-4 md:col-span-3 grid grid-cols-3 gap-4">
                {/* Stats Cards */}
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-white/5 rounded-lg border border-white/5 p-3 space-y-2">
                        <div className="w-8 h-8 rounded-full bg-white/10"></div>
                        <div className="w-12 h-4 bg-white/10 rounded-md"></div>
                    </div>
                ))}
                
                {/* Big Chart Area */}
                <div className="col-span-3 h-48 bg-gradient-to-b from-white/5 to-transparent rounded-lg border border-white/5 p-4 relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 right-0 h-24 flex items-end justify-between px-4 gap-1">
                        {[40, 70, 50, 90, 60, 80, 50, 70, 60, 90, 75, 45].map((h, idx) => (
                            <div key={idx} className="w-full bg-blue-500/20 rounded-t-sm hover:bg-blue-500/40 transition-colors" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="col-span-2 h-32 bg-white/5 rounded-lg border border-white/5 p-3 space-y-2">
                     <div className="w-24 h-4 bg-white/10 rounded-md mb-2"></div>
                     {[1, 2].map(j => (
                         <div key={j} className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-white/10"></div>
                             <div className="space-y-1">
                                 <div className="w-32 h-2 bg-white/10 rounded-full"></div>
                                 <div className="w-20 h-2 bg-white/5 rounded-full"></div>
                             </div>
                         </div>
                     ))}
                </div>
                
                {/* Side Widget */}
                <div className="col-span-1 h-32 bg-white/5 rounded-lg border border-white/5"></div>
            </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const FeatureBentoCard = ({ feature, className }: { feature: any, className?: string }) => (
  <div className={cn(
    "group relative overflow-hidden rounded-3xl bg-[#13151C] border border-white/5 p-6 hover:border-white/10 transition-all duration-300",
    className
  )}>
    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    <div className="relative z-10 h-full flex flex-col">
      <div className="mb-4 p-3 w-fit rounded-2xl bg-white/5 group-hover:bg-white/10 transition-colors text-white">
        {feature.icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-slate-100">{feature.title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm">{feature.description}</p>
      
      {feature.image && (
        <div className="mt-auto pt-6">
            <div className="rounded-lg overflow-hidden border border-white/5 bg-black/20">
                {feature.image}
            </div>
        </div>
      )}
    </div>
  </div>
);

const LandingPage = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isServicesLoading, setIsServicesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isLoading && session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, isLoading, navigate]);

  useEffect(() => {
    const fetchServices = async () => {
      setIsServicesLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('title');
        
      if (!error && data) {
        setServices(data as Service[]);
      }
      setIsServicesLoading(false);
    };
    fetchServices();
  }, []);

  const handleServiceSelect = (service: Service) => {
    const isEndToEnd = service.title.toLowerCase().includes('end to end');
    
    setSelectedServiceIds(prev => {
      // Check if clicking on an already selected item
      if (prev.includes(service.id)) {
        return prev.filter(id => id !== service.id);
      }

      // If clicking End to End, it clears everything else
      if (isEndToEnd) {
        return [service.id];
      }

      // If clicking a normal service, ensure End to End is NOT selected
      // First find the ID of any End to End service if it exists
      const endToEndService = services.find(s => s.title.toLowerCase().includes('end to end'));
      const endToEndId = endToEndService?.id;
      
      let newSelection = [...prev];
      
      // If End to End was selected, remove it
      if (endToEndId && newSelection.includes(endToEndId)) {
        newSelection = newSelection.filter(id => id !== endToEndId);
      }

      return [...newSelection, service.id];
    });
  };

  const handleContinue = () => {
    if (selectedServiceIds.length > 0) {
      // Preserve existing query params (e.g. UTM tags) and add services
      const params = new URLSearchParams(location.search);
      params.set('services', selectedServiceIds.join(','));
      // Redirect directly to Request page instead of login
      navigate(`/request?${params.toString()}`);
    }
  };

  const filteredServices = services.filter(service => 
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const allFeatures = [
    {
      icon: <LayoutGrid className="h-6 w-6" />,
      title: 'Unified Dashboard',
      description: 'A bird\'s eye view of your entire operation. Track projects, finances, and team activity in one place.',
      className: "md:col-span-2"
    },
    {
      icon: <ListChecks className="h-6 w-6" />,
      title: 'Task Management',
      description: 'Organize work with Kanban boards, lists, and calendar views. Never miss a deadline.',
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Team & People',
      description: 'Manage clients, team members, and roles with granular permissions.',
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: 'Real-time Chat',
      description: 'Built-in messaging for seamless team communication without switching apps.',
    },
    {
      icon: <BrainCircuit className="h-6 w-6" />,
      title: 'AI Assistant',
      description: 'Your smart companion for generating content, analyzing data, and automating workflows.',
      className: "md:col-span-2"
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: 'Billing & Invoicing',
      description: 'Track payments, generate invoices, and monitor project budgets.',
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: 'Goals & OKRs',
      description: 'Set ambitious goals and track progress with visual metrics.',
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: 'Knowledge Base',
      description: 'Centralize documentation, guides, and resources for your team.',
    },
    {
        icon: <Receipt className="h-6 w-6" />,
        title: 'Expense Tracking',
        description: 'Keep track of project expenses and operational costs.',
    },
    {
        icon: <Megaphone className="h-6 w-6" />,
        title: 'Publication',
        description: 'Manage announcements and broadcast updates to your users.',
    },
    {
        icon: <Bell className="h-6 w-6" />,
        title: 'Smart Notifications',
        description: 'Stay updated with intelligent alerts via App, Email, or WhatsApp.',
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0D14] text-slate-200 selection:bg-purple-500/30 font-sans">
      {/* Fixed Background Gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/10 blur-[120px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-pink-900/05 blur-[100px]"></div>
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0B0D14]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0B0D14]/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-white/10 group-hover:border-purple-500/50 transition-colors">
              <img src="https://quuecudndfztjlxbrvyb.supabase.co/storage/v1/object/public/General/logo.png" alt="7i Portal Logo" className="h-6 w-6 object-contain" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">7i Portal</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block">
              Log in
            </Link>
            <Button asChild className="bg-white text-black hover:bg-slate-200 rounded-full px-6 font-medium">
              <Link to="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-300 mb-8"
            >
              <Sparkles className="w-3 h-3" />
              <span>The modern workspace for forward-thinking teams</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500"
            >
              Simplify Work.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">Amplify Results.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-12 leading-relaxed"
            >
              The all-in-one client portal that brings your projects, team, and clients together in perfect harmony.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
            >
              <Button size="lg" className="h-12 px-8 rounded-full bg-white text-black hover:bg-slate-200 border-0 font-semibold transition-all" asChild>
                <Link to="/login">
                  Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white backdrop-blur-sm" onClick={() => document.getElementById('request-service')?.scrollIntoView({ behavior: 'smooth' })}>
                Make a Request
              </Button>
            </motion.div>

            <div className="max-w-6xl mx-auto px-4">
              <DashboardPreview />
            </div>
          </div>
        </section>

        {/* Request Service Segment */}
        <section id="request-service" className="py-24 relative border-t border-white/5 bg-black/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Project Support Request</h2>
              <p className="text-slate-400 mb-8">Select the services you need for your project. You can select multiple services.</p>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Search support options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#13151C] border-white/10 text-slate-200 placeholder:text-slate-600 pl-10 h-12 rounded-lg focus:ring-purple-500/50 focus:border-purple-500/50"
                />
              </div>
            </div>

            {isServicesLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 max-w-6xl mx-auto mb-12">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-48 bg-white/5 rounded-xl animate-pulse border border-white/5"></div>
                ))}
              </div>
            ) : services.length === 0 ? (
              // State: Database is empty (or fetch failed)
              <div className="text-center py-16 mb-12 border border-dashed border-white/10 rounded-xl bg-white/5 max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                  <Database className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-xl font-medium text-slate-300 mb-2">No services configured</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                   There are no services available at the moment.
                </p>
              </div>
            ) : filteredServices.length === 0 ? (
              // State: Search returned no results
              <div className="text-center py-16 mb-12 border border-dashed border-white/10 rounded-xl bg-white/5 max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                  <Search className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-xl font-medium text-slate-300 mb-2">No matching services</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  We couldn't find any services matching "{searchQuery}". Try different keywords.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 max-w-6xl mx-auto mb-12">
                {filteredServices.map((service) => {
                  const Icon = getIconComponent(service.icon);
                  const isSelected = selectedServiceIds.includes(service.id);
                  const textColorClass = service.icon_color?.split(' ').find(c => c.startsWith('text-'));

                  return (
                    <div
                      key={service.id}
                      onClick={() => handleServiceSelect(service)}
                      className={cn(
                        "cursor-pointer group relative p-6 rounded-xl border transition-all duration-300 flex flex-col items-start justify-between gap-6 h-full min-h-[200px]",
                        isSelected 
                          ? "bg-purple-900/20 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]" 
                          : "bg-[#13151C] border-white/5 hover:border-white/10 hover:bg-[#1A1D26] hover:-translate-y-1"
                      )}
                    >
                      <div className="w-full flex justify-between items-start">
                        <div className={cn(
                          "p-3 rounded-lg transition-colors duration-300 flex items-center justify-center w-12 h-12",
                          service.icon_color ? service.icon_color : "bg-white/10 text-white"
                        )}>
                          <Icon className={cn("w-6 h-6", textColorClass)} />
                        </div>
                        {service.is_featured && (
                          <Badge className="bg-green-500 text-black hover:bg-green-600 font-semibold px-2.5">
                            Featured
                          </Badge>
                        )}
                      </div>
                      
                      <div className="w-full">
                        <h3 className={cn(
                          "text-lg font-bold mb-2 leading-tight",
                          isSelected ? "text-white" : "text-slate-200"
                        )}>
                          {service.title}
                        </h3>
                        <p className={cn(
                          "text-sm leading-relaxed line-clamp-3",
                          isSelected ? "text-slate-300" : "text-slate-400"
                        )}>
                          {service.description}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="absolute top-6 right-6">
                          <div className="bg-purple-500 text-white rounded-full p-1 shadow-lg ring-2 ring-[#0B0D14]">
                              <Check className="w-3 h-3" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* All Features Section (Bento Grid) */}
        <section id="features" className="py-24 border-t border-white/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
              <div className="max-w-xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-500">
                  Everything your team needs.
                </h2>
                <p className="text-slate-400 text-lg">
                  A comprehensive suite of tools designed to streamline every aspect of your business operations.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
              {allFeatures.map((feature, index) => (
                <FeatureBentoCard 
                    key={index} 
                    feature={feature} 
                    className={feature.className}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent -z-10"></div>
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-8">Ready to transform your workflow?</h2>
                <Button size="lg" className="h-14 px-10 rounded-full bg-white text-black hover:bg-slate-200 text-lg font-semibold" asChild>
                    <Link to="/login">Get Started Now</Link>
                </Button>
            </div>
        </section>
      </main>

      {/* Sticky Service Summary Footer */}
      {selectedServiceIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0B0D14]/90 backdrop-blur-lg shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 overflow-hidden">
              <span className="text-sm text-slate-400 font-medium whitespace-nowrap">
                {selectedServiceIds.length} {selectedServiceIds.length === 1 ? 'Service' : 'Services'} Selected
              </span>
              <div className="flex flex-wrap gap-2 max-h-16 overflow-y-auto">
                {services.filter(s => selectedServiceIds.includes(s.id)).map(s => (
                  <div key={s.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/5 text-xs text-slate-200">
                    <span>{s.title}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button 
              onClick={handleContinue}
              className="bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg px-6 sm:px-8 h-10 sm:h-12 transition-colors shadow-lg shadow-green-900/20 flex-shrink-0"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <footer className="bg-[#0B0D14] border-t border-white/5 mb-[72px] sm:mb-0">
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