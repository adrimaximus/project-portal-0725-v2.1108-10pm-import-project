import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import { 
  BarChart, Users, ListChecks, ArrowRight, BrainCircuit, Check, 
  Sparkles, Globe, Smartphone, Palette, Search, Wrench, 
  CreditCard, MessageSquare, BookOpen, Bell, Shield, Zap,
  LayoutGrid, Target, Megaphone, Receipt, CalendarDays, Store, Truck
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Dashboard Preview Component with enhanced styling
const DashboardPreview = () => (
  <motion.div 
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    className="relative mt-16 lg:mt-24 group"
  >
    {/* Glow effect behind the dashboard */}
    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 via-blue-600/30 to-pink-600/30 rounded-2xl blur-3xl opacity-30 group-hover:opacity-50 transition duration-1000"></div>
    
    {/* Main Container - Glassmorphism */}
    <div className="relative bg-black/40 p-2 sm:p-3 rounded-xl shadow-2xl ring-1 ring-white/10 backdrop-blur-2xl transition-transform duration-500 hover:scale-[1.01]">
      <div className="bg-white/5 p-3 rounded-lg border border-white/5 overflow-hidden relative">
        
        {/* Fake Window Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-white/5 mb-4 bg-white/5 rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]/80"></div>
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]/80"></div>
            <div className="w-3 h-3 rounded-full bg-[#28C840]/80"></div>
          </div>
          <div className="flex gap-4 opacity-50">
             <div className="w-24 h-2 bg-white/10 rounded-full"></div>
             <div className="w-16 h-2 bg-white/10 rounded-full"></div>
          </div>
        </div>
        
        {/* Fake Dashboard UI */}
        <div className="grid grid-cols-4 gap-4 p-2">
            {/* Sidebar */}
            <div className="col-span-1 hidden md:flex flex-col space-y-3 pt-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-8 w-full hover:bg-white/5 rounded-md flex items-center px-2 gap-3 transition-colors">
                        <div className="w-4 h-4 bg-white/20 rounded-sm"></div>
                        <div className={`h-2 bg-white/10 rounded-full ${i === 2 ? 'w-12 bg-purple-500/50' : 'w-16'}`}></div>
                    </div>
                ))}
                
                <div className="mt-auto pt-8 space-y-3">
                     <div className="h-2 w-20 bg-white/5 rounded-full mx-2"></div>
                     <div className="h-2 w-16 bg-white/5 rounded-full mx-2"></div>
                </div>
            </div>
            
            {/* Main Content */}
            <div className="col-span-4 md:col-span-3 grid grid-cols-3 gap-4">
                {/* Insight Stats Cards */}
                {[
                    { label: "Total Revenue", value: "$124,500", change: "+12.5%", color: "text-emerald-400" },
                    { label: "Active Users", value: "8,240", change: "+5.2%", color: "text-blue-400" },
                    { label: "Engagement", value: "84%", change: "+2.1%", color: "text-purple-400" }
                ].map((stat, i) => (
                    <div key={i} className="h-28 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/5 p-4 flex flex-col justify-between group/card relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/card:opacity-20 transition-opacity">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex items-start justify-between">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center">
                                <img 
                                    src={`https://images.unsplash.com/photo-${i === 0 ? '1535713875002-d1d0cf377fde' : i === 1 ? '1494790108377-be9c29b29330' : '1599566150163-29194dcaad36'}?auto=format&fit=crop&w=100&h=100`}
                                    alt="Avatar" 
                                    className="w-full h-full object-cover opacity-80" 
                                />
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-400 mb-1">{stat.label}</div>
                            <div className="flex items-end gap-2">
                                <div className="text-xl font-bold text-slate-100">{stat.value}</div>
                                <div className={`text-xs ${stat.color} mb-1`}>{stat.change}</div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Big Chart Area - Insight Visualization */}
                <div className="col-span-3 h-56 bg-gradient-to-b from-white/5 to-transparent rounded-xl border border-white/5 p-5 relative overflow-hidden group/chart">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h4 className="text-sm font-semibold text-slate-200">Growth Analytics</h4>
                            <p className="text-xs text-slate-500">Year over year performance</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] text-slate-400">Daily</div>
                            <div className="px-2 py-1 rounded-md bg-purple-500/20 border border-purple-500/20 text-[10px] text-purple-300">Weekly</div>
                        </div>
                    </div>
                    
                    {/* Grid Lines */}
                    <div className="absolute inset-0 top-16 px-5 flex flex-col justify-between pointer-events-none opacity-20">
                        <div className="w-full h-px bg-white/10"></div>
                        <div className="w-full h-px bg-white/10"></div>
                        <div className="w-full h-px bg-white/10"></div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-between px-5 pb-2 gap-2">
                        {[45, 60, 75, 50, 80, 95, 70, 85, 65, 90, 100, 85, 60, 75, 90].map((h, idx) => (
                            <div key={idx} className="relative w-full group/bar">
                                <div 
                                    className="w-full bg-gradient-to-t from-purple-600/40 to-blue-500/40 rounded-t-sm group-hover/bar:from-purple-500/60 group-hover/bar:to-blue-400/60 transition-all duration-300" 
                                    style={{ height: `${h}%` }}
                                ></div>
                                <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-[10px] text-white px-2 py-1 rounded border border-white/10 transition-opacity whitespace-nowrap z-10">
                                    {h}% Growth
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity / Insights List */}
                <div className="col-span-2 h-40 bg-white/5 rounded-xl border border-white/5 p-4 space-y-3 overflow-hidden">
                     <div className="flex justify-between items-center mb-1">
                        <h4 className="text-xs font-semibold text-slate-300">Live Activity</h4>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                     </div>
                     
                     {[
                        { text: "New client onboarded: TechFlow Inc.", time: "2m ago", avatar: 1 },
                        { text: "Project 'Alpha' milestone completed", time: "15m ago", avatar: 2 },
                        { text: "Team meeting scheduled for 2 PM", time: "1h ago", avatar: 3 }
                     ].map((item, j) => (
                         <div key={j} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-default">
                             <div className="w-6 h-6 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                                <img 
                                    src={`https://images.unsplash.com/photo-${j === 0 ? '1527980965255-d3b416303d12' : j === 1 ? '1580489944761-15a19d654956' : '1507003211169-0a1dd7228f2d'}?auto=format&fit=crop&w=100&h=100`}
                                    alt="Activity Avatar" 
                                    className="w-full h-full object-cover opacity-90" 
                                />
                             </div>
                             <div className="flex-1 min-w-0">
                                 <div className="text-xs text-slate-300 truncate">{item.text}</div>
                             </div>
                             <div className="text-[10px] text-slate-500 whitespace-nowrap">{item.time}</div>
                         </div>
                     ))}
                </div>
                
                {/* Side Widget - AI Insight */}
                <div className="col-span-1 h-40 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl border border-white/10 p-4 flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5"></div>
                    <BrainCircuit className="w-8 h-8 text-purple-400 mb-2 opacity-80" />
                    <h4 className="text-xs font-semibold text-white mb-1">AI Insights</h4>
                    <p className="text-[10px] text-slate-400 leading-tight">Productivity is up by 24% this week. Great job!</p>
                    <div className="mt-3 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 w-[70%]"></div>
                    </div>
                </div>
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
    { id: 'event-management', label: 'Event Management', icon: CalendarDays },
    { id: 'booth-production', label: 'Booth Production', icon: Store },
    { id: 'brand-activation', label: 'Brand Activation', icon: Megaphone },
    { id: 'creative-design', label: 'Creative Design', icon: Palette },
    { id: 'logistics', label: 'Logistics & Setup', icon: Truck },
    { id: 'digital-engagement', label: 'Digital Engagement', icon: Smartphone },
  ];

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
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What do you need today?</h2>
              <p className="text-slate-400">Jumpstart your project request instantly.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto mb-12">
              {services.map((service) => {
                const Icon = service.icon;
                const isSelected = selectedService === service.id;
                return (
                  <div
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    className={cn(
                      "cursor-pointer group relative p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center gap-4 h-36",
                      isSelected 
                        ? "bg-purple-600/20 border-purple-500/50 shadow-[0_0_20px_rgba(147,51,234,0.2)]" 
                        : "bg-[#13151C] border-white/5 hover:border-white/10 hover:bg-[#1A1D26] hover:-translate-y-1"
                    )}
                  >
                    <div className={cn(
                      "p-3.5 rounded-xl transition-colors duration-300",
                      isSelected ? "bg-purple-600 text-white" : "bg-white/5 text-slate-400 group-hover:text-white group-hover:bg-white/10"
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={cn(
                      "text-sm font-medium text-center leading-tight",
                      isSelected ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                    )}>
                      {service.label}
                    </span>
                    {isSelected && (
                      <div className="absolute top-3 right-3 animate-in zoom-in duration-200">
                        <div className="bg-purple-600 rounded-full p-0.5">
                            <Check className="w-3 h-3 text-white" />
                        </div>
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
                  "rounded-full px-12 h-14 text-base font-semibold transition-all duration-500 shadow-lg",
                  selectedService 
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white opacity-100 translate-y-0" 
                    : "bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed opacity-50"
                )}
                disabled={!selectedService}
                asChild={!!selectedService}
              >
                {selectedService ? (
                  <Link to={`/login?service=${selectedService}`}>
                    Continue Request <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                ) : (
                  <span>Select a Service</span>
                )}
              </Button>
            </div>
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