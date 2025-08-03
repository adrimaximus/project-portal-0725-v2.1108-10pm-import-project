import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Search, Home, GanttChartSquare, Smile } from 'lucide-react';
import { GlobalCommandMenu } from './GlobalCommandMenu';
import { cn } from '@/lib/utils';

interface PortalLayoutProps {
  children: ReactNode;
  pageHeader?: ReactNode;
  noPadding?: boolean;
  disableMainScroll?: boolean;
  summary?: ReactNode;
}

const PortalLayout = ({ children, pageHeader, noPadding, disableMainScroll, summary }: PortalLayoutProps) => {
  const { user } = useUser();
  const location = useLocation();
  const [commandMenuOpen, setCommandMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/projects', label: 'Projects', icon: GanttChartSquare },
    { href: '/mood-tracker', label: 'Mood Tracker', icon: Smile },
  ];

  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <GanttChartSquare className="h-6 w-6" />
              <span className="">ProjectHub</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${location.pathname === link.href ? 'bg-muted text-primary' : ''}`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link to="/" className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <GanttChartSquare className="h-6 w-6" />
                  <span className="">ProjectHub</span>
                </Link>
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground ${location.pathname === link.href ? 'bg-muted text-foreground' : ''}`}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
             <Button
                variant="outline"
                className="w-full max-w-sm justify-start text-sm text-muted-foreground"
                onClick={() => setCommandMenuOpen(true)}
              >
                <Search className="mr-2 h-4 w-4" />
                Search...
                <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
          </div>
          <Avatar>
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </header>
        <main className={cn(
          "flex flex-1 flex-col gap-4 bg-background",
          !noPadding && "p-4 lg:gap-6 lg:p-6",
          disableMainScroll && "overflow-y-hidden"
        )}>
          {pageHeader}
          {summary}
          {children}
        </main>
      </div>
      <GlobalCommandMenu open={commandMenuOpen} setOpen={setCommandMenuOpen} />
    </div>
  );
};

export default PortalLayout;