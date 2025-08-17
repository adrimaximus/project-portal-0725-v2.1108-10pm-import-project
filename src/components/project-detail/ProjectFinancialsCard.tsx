import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/types";
import { DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProjectFinancialsCardProps {
  project: Project;
}

const paymentStatusConfig: Record<string, { color: string; label: string }> = {
  'Paid': { color: "bg-green-100 text-green-800", label: "Paid" },
  'Pending': { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  'Overdue': { color: "bg-red-100 text-red-800", label: "Overdue" },
  'Proposed': { color: "bg-blue-100 text-blue-800", label: "Proposed" },
  'Cancelled': { color: "bg-gray-100 text-gray-800", label: "Cancelled" },
};

const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
}).format(amount);

const ProjectFinancialsCard = ({ project }: ProjectFinancialsCardProps) => {
  const budget = project.budget || 0;
  const amountPaid = project.paymentStatus === 'Paid' ? budget : 0;
  const remainingBalance = budget - amountPaid;
  const paymentBadgeColor = paymentStatusConfig[project.paymentStatus]?.color || "bg-gray-100 text-gray-800";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Financials</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold">{formatCurrency(budget)}</div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Paid:</span>
            <span className="font-medium text-foreground">{formatCurrency(amountPaid)}</span>
          </div>
          <div className="flex justify-between">
            <span>Remaining:</span>
            <span className="font-medium text-foreground">{formatCurrency(remainingBalance)}</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span>Status:</span>
            <Badge variant="outline" className={cn("font-normal", paymentBadgeColor)}>
              {project.paymentStatus}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectFinancialsCard;