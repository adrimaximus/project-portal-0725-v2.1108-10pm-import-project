import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { useState } from "react";

const themes = [
  { id: 'claude-modern', name: 'Claude Modern', preview: (
    <div className="mt-4 h-24 rounded-md bg-[#1A1A1A] flex items-center justify-center text-sm text-white p-4 border border-gray-700">
      <div className="w-full space-y-2">
        <div className="h-3 w-3/4 rounded-full bg-gray-600"></div>
        <div className="h-3 w-1/2 rounded-full bg-gray-500"></div>
      </div>
    </div>
  )},
  { id: 'minimal', name: 'Minimal', preview: (
    <div className="mt-4 h-24 rounded-md border bg-white flex items-center justify-center text-sm text-black p-4">
      <div className="w-full space-y-2">
        <div className="h-3 w-3/4 rounded-full bg-gray-300"></div>
        <div className="h-3 w-1/2 rounded-full bg-gray-200"></div>
      </div>
    </div>
  )},
  { id: 'tangerine', name: 'Tangerine', preview: (
    <div className="mt-4 h-24 rounded-md bg-[#F97316] flex items-center justify-center text-sm text-white p-4">
       <div className="w-full space-y-2">
        <div className="h-3 w-3/4 rounded-full bg-orange-300"></div>
        <div className="h-3 w-1/2 rounded-full bg-orange-200"></div>
      </div>
    </div>
  )},
];

const ThemeSettingsPage = () => {
  const [currentTheme, setCurrentTheme] = useState('claude-modern'); 

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Theme Settings</h1>
          <p className="text-muted-foreground">
            Choose a theme to customize the appearance of your workspace.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Available Themes</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={currentTheme} onValueChange={setCurrentTheme} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {themes.map((theme) => (
                <Label key={theme.id} htmlFor={theme.id} className="relative block cursor-pointer rounded-lg border bg-card text-card-foreground shadow-sm p-4 has-[:checked]:border-primary">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{theme.name}</span>
                    <RadioGroupItem value={theme.id} id={theme.id} className="sr-only" />
                  </div>
                  {theme.preview}
                  {currentTheme === theme.id && (
                    <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
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