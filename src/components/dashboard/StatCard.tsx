import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  description?: string;
}

const StatCard = ({ title, value, icon, description }: StatCardProps) => {
  let targetValue: number | null = null;
  let isCurrency = false;

  if (typeof value === 'number') {
    targetValue = value;
  } else if (typeof value === 'string' && value.startsWith('Rp')) {
    const numericPart = parseFloat(value.replace(/[^0-9]/g, ''));
    if (!isNaN(numericPart)) {
      targetValue = numericPart;
      isCurrency = true;
    }
  }

  const animatedValue = useAnimatedCounter(targetValue ?? 0, 750);

  const displayValue = () => {
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