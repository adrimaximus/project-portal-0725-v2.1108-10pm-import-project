import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const themes = [
  {
    name: "Claude",
    colors: ["bg-slate-900", "bg-slate-100", "bg-violet-500", "bg-amber-400"],
  },
  {
    name: "Modern Minimal",
    colors: ["bg-white", "bg-gray-200", "bg-black", "bg-gray-400"],
  },
  {
    name: "Tangerine",
    colors: ["bg-orange-500", "bg-orange-100", "bg-gray-800", "bg-white"],
  },
];

const ThemeSettingsPage = () => {
  const [selectedTheme, setSelectedTheme] = useState("Claude");

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Theme</h1>
          <p className="text-muted-foreground">
            Select a theme to customize the appearance of your workspace.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {themes.map((theme) => (
            <Card
              key={theme.name}
              onClick={() => setSelectedTheme(theme.name)}
              className={cn(
                "cursor-pointer transition-all",
                selectedTheme === theme.name
                  ? "ring-2 ring-primary"
                  : "hover:shadow-md"
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-medium">{theme.name}</CardTitle>
                {selectedTheme === theme.name && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  {theme.colors.map((color, index) => (
                    <div
                      key={index}
                      className={cn("h-10 w-full rounded-md", color)}
                    />
                  ))}
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