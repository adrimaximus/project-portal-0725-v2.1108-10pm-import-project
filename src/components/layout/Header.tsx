import { Link, useLocation } from 'react-router-dom';
import { Target, Settings, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Header = () => {
  const location = useLocation();

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/goals', label: 'Goals', icon: Target },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="bg-background border-b sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <Target className="h-6 w-6 text-primary" />
            <span>GoalTracker</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-2">
            {navLinks.map(link => (
              <Button key={link.href} variant="ghost" asChild className={cn(location.pathname === link.href && 'font-bold bg-muted')}>
                <Link to={link.href}>
                  <link.icon className="mr-2 h-4 w-4" />
                  {link.label}
                </Link>
              </Button>
            ))}
          </nav>
          <div className="md:hidden">
            {/* Mobile menu can be added here */}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;