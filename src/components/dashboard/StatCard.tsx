import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { useAuth } from "@/contexts/AuthContext";
import { Lock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  description?: string;
  permission?: string;
  projects?: { name: string }[];
}

const StatCard = ({ title, value, icon, description, permission, projects }: StatCardProps) => {
  const { hasPermission } = useAuth();
  const canView = !permission || hasPermission(permission);

  let targetValue: number | null = null;
  let isCurrency = false;

  if (canView) {
    if (typeof value === 'number') {
      targetValue = value;
    } else if (typeof value === 'string' && value.startsWith('Rp')) {
      const numericPart = parseFloat(value.replace(/[^0-9]/g, ''));
      if (!isNaN(numericPart)) {
        targetValue = numericPart;
        isCurrency = true;
      }
    }
  }

  const animatedValue = useAnimatedCounter(targetValue ?? 0, 750);

  const displayValue = () => {
    if (!canView) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lock className="h-5 w-5" />
          <span>Restricted</span>
        </div>
      );
    }
    if (targetValue !== null) {
      if (isCurrency) {
        return `Rp\u00A0${new Intl.NumberFormat('id-ID').format(animatedValue)}`;
      }
      return new Intl.NumberFormat('id-ID').format(animatedValue);
    }
    return value; // Render non-numeric values directly
  };

  const valueDisplay = <div className="text-xl font-bold sm:text-2xl break-words">{displayValue()}</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {projects && projects.length > 0 && canView ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {valueDisplay}
              </TooltipTrigger>
              <TooltipContent>
                <div className="p-1">
                  <p className="font-semibold mb-1 text-sm">Projects:</p>
                  <ul className="list-disc list-inside space-y-1 max-h-48 overflow-y-auto">
                    {projects.map((project, index) => (
                      <li key={index} className="text-xs">{project.name}</li>
                    ))}
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          valueDisplay
        )}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
};

export default StatCard;