import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeProvider";
import type { Theme } from "@/types";

const themeFamilies = [
  { 
    id: 'default', 
    name: 'Default', 
    description: 'The standard light and dark themes for your workspace.',
    lightThemeId: 'light',
    darkThemeId: 'dark',
    preview: (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md border bg-background flex items-center justify-center p-1">
          <div className="w-full space-y-1">
            <div className="h-1 w-3/4 rounded-full bg-muted-foreground/30"></div>
            <div className="h-1 w-1/2 rounded-full bg-primary/30"></div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-md border bg-slate-900 flex items-center justify-center p-1">
          <div className="w-full space-y-1">
            <div className="h-1 w-3/4 rounded-full bg-slate-700"></div>
            <div className="h-1 w-1/2 rounded-full bg-slate-500"></div>
          </div>
        </div>
      </div>
    )
  },
  { 
    id: 'claude', 
    name: 'Claude', 
    description: 'A sleek, modern theme inspired by AI interfaces.',
    lightThemeId: 'claude-light',
    darkThemeId: 'claude',
    preview: (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-[#F6F5F1] border border-[#EAE8E2] flex items-center justify-center p-1">
          <div className="w-full space-y-1">
            <div className="h-1 w-3/4 rounded-full bg-[#352F2A]/30"></div>
            <div className="h-1 w-1/2 rounded-full bg-[#D96D4A]/50"></div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-md bg-[#1C1917] border border-[#292524] flex items-center justify-center p-1">
          <div className="w-full space-y-1">
            <div className="h-1 w-3/4 rounded-full bg-[#A8A29E]/50"></div>
            <div className="h-1 w-1/2 rounded-full bg-[#E07A5F]"></div>
          </div>
        </div>
      </div>
    )
  },
  { 
    id: 'nature', 
    name: 'Nature', 
    description: 'Earthy tones and organic green accents for a calming feel.',
    lightThemeId: 'nature-light',
    darkThemeId: 'nature',
    preview: (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-[#FBF9F6] border border-[#E0DACE] flex items-center justify-center p-1">
          <div className="w-full space-y-1">
            <div className="h-1 w-3/4 rounded-full bg-[#40332B]/30"></div>
            <div className="h-1 w-1/2 rounded-full bg-[#4D7C57]/50"></div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-md bg-[#1C1F1D] border border-gray-700 flex items-center justify-center p-1">
          <div className="w-full space-y-1">
            <div className="h-1 w-3/4 rounded-full bg-gray-600"></div>
            <div className="h-1 w-1/2 rounded-full bg-[#7BA083]"></div>
          </div>
        </div>
      </div>
    )
  },
  { 
    id: 'corporate', 
    name: 'Corporate', 
    description: 'A professional theme with a clean, corporate look.',
    lightThemeId: 'corporate-light',
    darkThemeId: 'corporate',
    preview: (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-white border border-zinc-200 flex items-center justify-center p-1">
          <div className="w-full space-y-1">
            <div className="h-1 w-3/4 rounded-full bg-zinc-400/50"></div>
            <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: '#2563eb80' }}></div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-md bg-zinc-950 border border-zinc-800 flex items-center justify-center p-1">
          <div className="w-full space-y-1">
            <div className="h-1 w-3/4 rounded-full bg-zinc-600"></div>
            <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: '#60a5fa' }}></div>
          </div>
        </div>
      </div>
    )
  }
];

const getThemeFamily = (theme: Theme): 'default' | 'claude' | 'nature' | 'corporate' => {
  if (theme === 'claude' || theme === 'claude-light') {
    return 'claude';
  }
  if (theme === 'nature' || theme === 'nature-light') {
    return 'nature';
  }
  if (theme === 'corporate' || theme === 'corporate-light') {
    return 'corporate';
  }
  return 'default';
};

const ThemeSettingsPage = () => {
  const { theme: currentTheme, setTheme } = useTheme();

  const currentFamily = getThemeFamily(currentTheme);

  const handleFamilyChange = (familyId: string) => {
    const selectedFamily = themeFamilies.find(f => f.id === familyId);
    if (selectedFamily) {
      const isCurrentlyDark = ['dark', 'claude', 'nature', 'corporate'].includes(currentTheme) || 
                             (currentTheme === 'system' && window.matchMedia("(prefers-color-scheme: dark)").matches);
      
      const newTheme = isCurrentlyDark ? selectedFamily.darkThemeId : selectedFamily.lightThemeId;
      setTheme(newTheme as Theme);
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/settings">Settings</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Theme</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Theme Settings</h1>
          <p className="text-muted-foreground">
            Choose a theme to customize the appearance of your workspace.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Select a theme for your workspace. This will only affect your view.</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={currentFamily} onValueChange={handleFamilyChange} className="space-y-2">
              {themeFamilies.map((family) => (
                <Label 
                  key={family.id} 
                  htmlFor={family.id} 
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors",
                    currentFamily === family.id ? "border-primary bg-muted/50" : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {family.preview}
                    <div>
                      <span className="font-medium">{family.name}</span>
                      <p className="text-sm text-muted-foreground">{family.description}</p>
                    </div>
                  </div>
                  <RadioGroupItem value={family.id} id={family.id} />
                </Label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default ThemeSettingsPage;