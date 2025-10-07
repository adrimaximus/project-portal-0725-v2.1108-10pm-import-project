import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { useTheme, type ThemePalette } from "@/contexts/ThemeProvider";

const themes = [
  { id: 'default', name: 'Default', description: 'The standard theme for your workspace. Adapts to light and dark mode.', preview: (
    <div className="w-8 h-8 rounded-md border bg-background flex items-center justify-center p-1">
      <div className="w-full space-y-1">
        <div className="h-1 w-3/4 rounded-full bg-muted-foreground/30"></div>
        <div className="h-1 w-1/2 rounded-full bg-primary/30"></div>
      </div>
    </div>
  )},
  { id: 'claude', name: 'Claude', description: 'A sleek theme inspired by modern AI interfaces. Adapts to light and dark mode.', preview: (
    <div className="w-8 h-8 rounded-md flex">
        <div className="w-1/2 h-full bg-[#1A1A1A] rounded-l-md border border-r-0 border-gray-700"></div>
        <div className="w-1/2 h-full bg-[#F6F7F4] rounded-r-md border border-l-0 border-[#EAEBE7]"></div>
    </div>
  )},
];

const ThemeSettingsPage = () => {
  const { theme: currentTheme, setTheme } = useTheme();

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
            <RadioGroup value={currentTheme} onValueChange={(value) => setTheme(value as ThemePalette)} className="space-y-2">
              {themes.map((theme) => (
                <Label 
                  key={theme.id} 
                  htmlFor={theme.id} 
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors",
                    currentTheme === theme.id ? "border-primary bg-muted/50" : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {theme.preview}
                    <div>
                      <span className="font-medium">{theme.name}</span>
                      <p className="text-sm text-muted-foreground">{theme.description}</p>
                    </div>
                  </div>
                  <RadioGroupItem value={theme.id} id={theme.id} />
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