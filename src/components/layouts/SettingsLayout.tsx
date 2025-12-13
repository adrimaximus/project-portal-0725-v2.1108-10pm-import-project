import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { settingsLinks } from '@/config/settings';

const SettingsLayout = () => {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <aside className="lg:w-1/4 xl:w-1/5">
        <h2 className="text-lg font-semibold mb-4 px-2">Settings</h2>
        <nav className="flex flex-col space-y-1">
          {settingsLinks.sort((a, b) => a.title.localeCompare(b.title)).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-muted font-semibold text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )
              }
            >
              <link.icon className="h-4 w-4" />
              <span>{link.title}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default SettingsLayout;