import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { useAuth } from "@/contexts/AuthContext";
import { Lock } from "lucide-react";

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  description?: string;
  permission?: string;
}

const StatCard = ({ title, value, icon, description, permission }: StatCardProps) => {
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold sm:text-2xl break-words">{displayValue()}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
};

export default StatCard;