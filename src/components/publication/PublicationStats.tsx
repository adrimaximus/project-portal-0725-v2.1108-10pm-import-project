import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BarChart3, Globe, Zap } from "lucide-react";

interface PublicationStatsProps {
  campaigns: any[];
}

export default function PublicationStats({ campaigns }: PublicationStatsProps) {
  const total = campaigns.length;
  // Simulating active based on recent creation for demo purposes, or just generic logic
  const active = campaigns.length; 

  const stats = [
    {
      title: "Total Campaigns",
      value: total,
      icon: Globe,
      description: "All time campaigns",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Active Publications",
      value: active,
      icon: Zap,
      description: "Currently running",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Total Reach",
      value: "2.4k", // Placeholder for visual sleekness
      icon: BarChart3,
      description: "Estimated views",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, index) => (
        <Card key={index} className="border-muted/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
                <span className="text-xs text-muted-foreground">{stat.description}</span>
              </div>
            </div>
            <div className={cn("p-3 rounded-xl", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}