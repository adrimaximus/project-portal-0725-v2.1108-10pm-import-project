import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Cog, Users, Compass, Puzzle } from "lucide-react";

const links = [
  { name: "General", href: "/settings", icon: Cog, end: true },
  { name: "Team", href: "/settings/team", icon: Users },
  { name: "Navigation", href: "/settings/navigation", icon: Compass },
  { name: "Integrations", href: "/settings/integrations", icon: Puzzle },
];

const SettingsSidebar = () => {
  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <nav className="flex flex-row md:flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.href}
            end={link.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-muted text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )
            }
          >
            <link.icon className="h-4 w-4" />
            <span className="flex-1 md:flex-grow-0">{link.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default SettingsSidebar;