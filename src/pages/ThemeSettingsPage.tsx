import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const themes = [
  { name: 'Default', id: 'default', colors: { primary: 'bg-slate-900', secondary: 'bg-slate-100', accent: 'bg-slate-200' } },
  { name: 'Claude Modern Minimal', id: 'theme-claude-modern-minimal', colors: { primary: 'bg-gray-900', secondary: 'bg-gray-100', accent: 'bg-gray-200' } },
  { name: 'Tangerine', id: 'theme-tangerine', colors: { primary: 'bg-orange-500', secondary: 'bg-orange-100', accent: 'bg-orange-200' } },
];

const ThemeSettingsPage = () => {
  const { theme, setTheme } = useTheme();

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Theme</h1>
          <p className="text-muted-foreground">
            Pilih tema untuk menyesuaikan tampilan aplikasi.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {themes.map((t) => (
            <Card
              key={t.id}
              onClick={() => setTheme(t.id as any)}
              className={cn(
                "cursor-pointer hover:bg-muted/50 transition-colors",
                theme === t.id && "ring-2 ring-primary"
              )}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base font-medium">
                  {t.name}
                  {theme === t.id && <Check className="h-4 w-4 text-primary" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                    <div className={cn("h-8 w-8 rounded-full", t.colors.primary)}></div>
                    <div className={cn("h-8 w-8 rounded-full", t.colors.secondary)}></div>
                    <div className={cn("h-8 w-8 rounded-full", t.colors.accent)}></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
};

export default ThemeSettingsPage;