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

// Dashboard Preview Component with enhanced styling matching the attached skeleton
const DashboardPreview = () => (
  <motion.div 
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    className="relative mt-16 lg:mt-24 group"
  >
    {/* Glow effect behind the dashboard */}
    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 via-slate-600/20 to-emerald-600/20 rounded-3xl blur-3xl opacity-30 group-hover:opacity-50 transition duration-1000"></div>
    
    {/* Main Container - Glassmorphism */}
    <div className="relative bg-black/40 p-2 sm:p-3 rounded-2xl shadow-2xl ring-1 ring-white/10 backdrop-blur-2xl transition-transform duration-500 hover:scale-[1.005]">
      <div className="bg-[#0F1117] rounded-xl border border-white/5 overflow-hidden relative flex h-[650px] md:h-[750px]">
        
        {/* Sidebar Skeleton */}
        <div className="w-64 hidden lg:flex flex-col border-r border-white/5 bg-[#0B0D14] p-5 gap-6 shrink-0">
            {/* Logo area */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600/30 to-blue-600/30 border border-white/10"></div>
                <div className="h-4 w-20 bg-white/10 rounded-md"></div>
            </div>

            {/* Nav Items */}
            <div className="space-y-1">
                {/* Dashboard Active */}
                <div className="h-10 w-full bg-white/5 border border-white/5 rounded-lg flex items-center px-3 gap-3">
                    <div className="w-4 h-4 rounded bg-emerald-500/50"></div>
                    <div className="h-2 w-24 bg-white/20 rounded-full"></div>
                </div>
                {/* Other Items */}
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 w-full hover:bg-white/5 rounded-lg flex items-center px-3 gap-3 transition-colors">
                        <div className="w-4 h-4 rounded bg-white/10"></div>
                        <div className="h-2 w-16 bg-white/10 rounded-full"></div>
                    </div>
                ))}
                
                {/* Section Header */}
                <div className="pt-6 pb-2 px-1 flex justify-between items-center opacity-50">
                    <div className="h-2 w-20 bg-white/10 rounded-full"></div>
                    <div className="w-3 h-3 bg-white/10 rounded-full"></div>
                </div>
                {[1, 2, 3, 4].map(i => (
                    <div key={`sub-${i}`} className="h-10 w-full hover:bg-white/5 rounded-lg flex items-center px-3 gap-3 transition-colors">
                        <div className="w-4 h-4 rounded bg-white/10"></div>
                        <div className="h-2 w-20 bg-white/10 rounded-full"></div>
                    </div>
                ))}
            </div>

            {/* Bottom User */}
            <div className="mt-auto space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 px-1">
                    <div className="w-3 h-3 rounded-full bg-white/20"></div>
                    <div className="h-2 w-16 bg-white/10 rounded-full"></div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden relative">
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0B0D14] z-10"></div>
                        <img 
                            src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&h=100&q=80" 
                            className="w-full h-full object-cover opacity-80" 
                            alt="User"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <div className="h-2.5 w-24 bg-white/20 rounded-full"></div>
                        <div className="h-2 w-16 bg-white/10 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0F1117]">
            {/* Top Navigation Bar */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
                <div className="relative">
                    <div className="w-64 h-9 bg-[#0B0D14] rounded-lg border border-white/5 flex items-center px-3 gap-2">
                        <div className="w-4 h-4 rounded-full border border-white/20"></div>
                        <div className="h-2 w-24 bg-white/10 rounded-full"></div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                        <div className="w-4 h-4 rounded-sm bg-white/20"></div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                        <div className="w-4 h-4 rounded-full bg-white/20"></div>
                    </div>
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                        <img 
                            src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&h=100&q=80" 
                            className="w-full h-full object-cover opacity-80" 
                            alt="Profile"
                        />
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 p-6 md:p-8 overflow-hidden flex flex-col gap-6">
                {/* Stats Overview with Insight Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                    {[
                        { label: "Total Revenue", value: "$84,230", trend: "+12%", color: "text-emerald-400" },
                        { label: "Active Projects", value: "24", trend: "+4", color: "text-blue-400" },
                        { label: "Team Members", value: "12", trend: "0", color: "text-slate-400" },
                        { label: "Efficiency", value: "94%", trend: "+2.5%", color: "text-purple-400" }
                    ].map((stat, i) => (
                        <div key={i} className="bg-[#0B0D14] p-4 rounded-xl border border-white/5 flex flex-col gap-1 hover:border-white/10 transition-colors">
                            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{stat.label}</div>
                            <div className="flex items-end justify-between">
                                <div className="text-xl font-bold text-slate-100">{stat.value}</div>
                                <div className={cn("text-xs font-medium", stat.color)}>{stat.trend}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                    {/* Main Chart Area */}
                    <div className="lg:col-span-2 bg-[#0B0D14] rounded-2xl border border-white/5 p-6 flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-slate-200 font-medium">Performance Overview</h3>
                                <p className="text-xs text-slate-500">Project completion rate over time</p>
                            </div>
                            {/* Avatar Pile - Hyper Realistic */}
                            <div className="flex -space-x-2">
                                {[
                                    "1534528741775-53994a69daeb",
                                    "1506794778202-cad84cf45f1d",
                                    "1500648767791-00dcc994a43e",
                                    "1535713875002-d1d0cf377fde"
                                ].map((id, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0B0D14] overflow-hidden bg-white/5">
                                        <img 
                                            src={`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=100&h=100&q=80`} 
                                            className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" 
                                            alt="Member"
                                        />
                                    </div>
                                ))}
                                <div className="w-8 h-8 rounded-full border-2 border-[#0B0D14] bg-white/10 flex items-center justify-center text-[10px] text-white">
                                    +4
                                </div>
                            </div>
                        </div>
                        
                        {/* Chart Visual */}
                        <div className="flex-1 relative flex items-end justify-between gap-2 px-2 mt-4 opacity-80">
                             {[30, 45, 35, 60, 50, 75, 60, 85, 70, 95, 80, 65].map((h, i) => (
                                 <div key={i} className="w-full bg-gradient-to-t from-purple-500/20 to-blue-500/40 rounded-t-sm group hover:to-blue-500/60 transition-all duration-500 relative">
                                    <div className="absolute bottom-0 w-full bg-purple-500/10 h-full" style={{ height: `${h}%` }}></div>
                                    <div className="absolute bottom-0 w-full bg-gradient-to-t from-purple-500 to-blue-500 opacity-20 h-full" style={{ height: `${h}%` }}></div>
                                 </div>
                             ))}
                        </div>
                    </div>

                    {/* Right Column: Top Contributors with Realistic Avatars */}
                    <div className="bg-[#0B0D14] rounded-2xl border border-white/5 p-6 flex flex-col overflow-hidden">
                        <h3 className="text-slate-200 font-medium mb-4">Top Contributors</h3>
                        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                            {[
                                { name: "Alex Morgan", role: "Project Lead", img: "1507003211169-0a1dd7228f2d", score: "98" },
                                { name: "Sarah Chen", role: "UI Designer", img: "1494790108377-be9c29b29330", score: "95" },
                                { name: "James Wilson", role: "Developer", img: "1500648767791-00dcc994a43e", score: "92" },
                                { name: "Mia Park", role: "Marketing", img: "1534528741775-53994a69daeb", score: "89" }
                            ].map((user, i) => (
                                <div key={i} className="flex items-center gap-3 group cursor-pointer">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 group-hover:border-purple-500/50 transition-colors bg-white/5">
                                            <img 
                                                src={`https://images.unsplash.com/photo-${user.img}?auto=format&fit=crop&w=100&h=100&q=80`} 
                                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" 
                                                alt={user.name} 
                                            />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#0B0D14] rounded-full flex items-center justify-center">
                                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0B0D14]"></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-slate-200 font-medium truncate">{user.name}</div>
                                        <div className="text-xs text-slate-500 truncate">{user.role}</div>
                                    </div>
                                    <div className="text-xs font-bold text-purple-400 bg-purple-400/10 px-2 py-1 rounded-md">
                                        {user.score}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-white/5">
                            <div className="h-10 w-full bg-white/5 rounded-lg flex items-center justify-center text-xs text-slate-400 font-medium hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
                                View All Members
                            </div>
                        </div>
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