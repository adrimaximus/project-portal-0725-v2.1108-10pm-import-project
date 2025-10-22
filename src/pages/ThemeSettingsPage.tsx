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
        <div className="w-8 h-8 rounded-md border bg-white flex items-center justify-center p-1">
          <div className="w-full space-y-1">
            <div className="h-1 w-3/4 rounded-full bg-slate-300"></div>
            <div className="h-1 w-1/2 rounded-full bg-slate-800/50"></div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-md border border-slate-800 bg-slate-950 flex items-center justify-center p-1">
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
        <div className="w-8 h-8 rounded-md flex items-center justify-center p-1" style={{ backgroundColor: 'oklch(0.98 0.01 95.10)', borderColor: 'oklch(0.88 0.01 97.36)', borderWidth: '1px' }}>
          <div className="w-full space-y-1">
            <div className="h-1 w-3/4 rounded-full" style={{ backgroundColor: 'oklch(0.34 0.03 95.72 / 0.3)' }}></div>
            <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: 'oklch(0.62 0.14 39.04 / 0.5)' }}></div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-md flex items-center justify-center p-1" style={{ backgroundColor: 'oklch(0.27 0.00 106.64)', borderColor: 'oklch(0.36 0.01 106.89)', borderWidth: '1px' }}>
          <div className="w-full space-y-1">
            <div className="h-1 w-3/4 rounded-full" style={{ backgroundColor: 'oklch(0.81 0.01 93.01 / 0.5)' }}></div>
            <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: 'oklch(0.67 0.13 38.76)' }}></div>
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
  },
  { 
    id: 'ahensi', 
    name: 'Ahensi', 
    description: 'A vibrant, modern theme with a pink accent, inspired by the 7i portal logo.',
    lightThemeId: 'ahensi-light',
    darkThemeId: 'ahensi',
    preview: (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-white border border-zinc-200 flex items-center justify-center p-1">
          <div className="w-full space-y-1">
            <div className="h-1 w-3/4 rounded-full bg-zinc-400/50"></div>
            <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: '#fa009f80' }}></div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-md bg-zinc-950 border border-zinc-800 flex items-center justify-center p-1">
          <div className="w-full space-y-1">
            <div className="h-1 w-3/4 rounded-full bg-zinc-600"></div>
            <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: '#fa009f' }}></div>
          </div>
        </div>
      </div>
    )
  },
  { 
    id: 'brand-activator', 
    name: 'Brand Activator', 
    description: 'A professional theme inspired by the 7inked brand colors.',
    lightThemeId: 'brand-activator-light',
    darkThemeId: 'brand-activator',
    preview: (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-white border border-zinc-200 flex items-center justify-center p-1">
          <div className="w-full space-y-1">
            <div className="h-1 w-3/4 rounded-full bg-zinc-400/50"></div>
            <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: '#008A9E80' }}></div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-md bg-[#17191c] border border-zinc-800 flex items-center justify-center p-1">
          <div className="w-full space-y-1">
            <div className="h-1 w-3/4 rounded-full bg-zinc-600"></div>
            <div className="h-1 w-1/2 rounded-full" style={{ backgroundColor: '#00A9C7' }}></div>
          </div>
        </div>
      </div>
    )
  }
];

const getThemeFamily = (theme: Theme): 'default' | 'claude' | 'nature' | 'corporate' | 'ahensi' | 'brand-activator' => {
  if (theme === 'claude' || theme === 'claude-light') {
    return 'claude';
  }
  if (theme === 'nature' || theme === 'nature-light') {
    return 'nature';
  }
  if (theme === 'corporate' || theme === 'corporate-light') {
    return 'corporate';
  }
  if (theme === 'ahensi' || theme === 'ahensi-light') {
    return 'ahensi';
  }
  if (theme === 'brand-activator' || theme === 'brand-activator-light') {
    return 'brand-activator';
  }
  return 'default';
};

const ThemeSettingsPage = () => {
  const { theme: currentTheme, setTheme } = useTheme();

  const currentFamily = getThemeFamily(currentTheme);

  const handleFamilyChange = (familyId: string) => {
    const selectedFamily = themeFamilies.find(f => f.id === familyId);
    if (selectedFamily) {
      const isCurrentlyDark = document.documentElement.classList.contains('dark');
      
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