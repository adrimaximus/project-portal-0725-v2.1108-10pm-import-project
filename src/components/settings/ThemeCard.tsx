import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, Laptop } from "lucide-react";

const ThemeCard = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Theme</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Select the theme for the dashboard.
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={theme === 'light' ? 'default' : 'outline'}
            onClick={() => setTheme('light')}
            className="flex flex-col h-auto py-2"
          >
            <Sun className="h-5 w-5 mb-1" />
            <span className="text-xs">Light</span>
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'outline'}
            onClick={() => setTheme('dark')}
            className="flex flex-col h-auto py-2"
          >
            <Moon className="h-5 w-5 mb-1" />
            <span className="text-xs">Dark</span>
          </Button>
          <Button
            variant={theme === 'system' ? 'default' : 'outline'}
            onClick={() => setTheme('system')}
            className="flex flex-col h-auto py-2"
          >
            <Laptop className="h-5 w-5 mb-1" />
            <span className="text-xs">System</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ThemeCard;