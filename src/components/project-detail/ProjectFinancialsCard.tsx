import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/types";
import { DollarSign } from "lucide-react";

interface ProjectFinancialsCardProps {
  project: Project;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
}).format(amount);

const ProjectFinancialsCard = ({ project }: ProjectFinancialsCardProps) => {
  const budget = project.budget || 0;
  const amountPaid = project.paymentStatus === 'Paid' ? budget : 0;
  const remainingBalance = budget - amountPaid;

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
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectFinancialsCard;