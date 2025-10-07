import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

const themes = [
  { id: 'default', name: 'Default', description: 'The standard light theme for your workspace.', preview: (
    <div className="w-8 h-8 rounded-md border bg-background flex items-center justify-center p-1">
      <div className="w-full space-y-1">
        <div className="h-1 w-3/4 rounded-full bg-muted-foreground/30"></div>
        <div className="h-1 w-1/2 rounded-full bg-primary/30"></div>
      </div>
    </div>
  )},
  { id: 'claude-modern', name: 'Claude Modern', description: 'A sleek, dark theme inspired by modern AI interfaces.', preview: (
    <div className="w-8 h-8 rounded-md bg-[#1A1A1A] border border-gray-700 flex items-center justify-center p-1">
      <div className="w-full space-y-1">
        <div className="h-1 w-3/4 rounded-full bg-gray-600"></div>
        <div className="h-1 w-1/2 rounded-full bg-gray-500"></div>
      </div>
    </div>
  )},
  { id: 'minimal', name: 'Minimal', description: 'A clean and simple light theme for a focused experience.', preview: (
    <div className="w-8 h-8 rounded-md border bg-white flex items-center justify-center p-1">
      <div className="w-full space-y-1">
        <div className="h-1 w-3/4 rounded-full bg-gray-300"></div>
        <div className="h-1 w-1/2 rounded-full bg-gray-200"></div>
      </div>
    </div>
  )},
  { id: 'tangerine', name: 'Tangerine', description: 'A vibrant and energetic theme with a splash of color.', preview: (
    <div className="w-8 h-8 rounded-md bg-[#F97316] flex items-center justify-center p-1">
       <div className="w-full space-y-1">
        <div className="h-1 w-3/4 rounded-full bg-orange-300"></div>
        <div className="h-1 w-1/2 rounded-full bg-orange-200"></div>
      </div>
    </div>
  )},
];

const ThemeSettingsPage = () => {
  const [currentTheme, setCurrentTheme] = useState('default'); 

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
            <RadioGroup value={currentTheme} onValueChange={setCurrentTheme} className="space-y-2">
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