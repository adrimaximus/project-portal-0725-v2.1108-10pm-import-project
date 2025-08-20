import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project, PAYMENT_STATUS_OPTIONS } from "@/types";
import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ProjectPaymentStatusCardProps {
  project: Project;
  isEditing: boolean;
  onFieldChange: (field: keyof Project, value: any) => void;
}

const paymentStatusConfig: Record<string, { color: string; label: string }> = {
  'Paid': { color: "bg-green-100 text-green-800", label: "Paid" },
  'Pending': { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  'In Process': { color: "bg-purple-100 text-purple-800", label: "In Process" },
  'Overdue': { color: "bg-red-100 text-red-800", label: "Overdue" },
  'Proposed': { color: "bg-blue-100 text-blue-800", label: "Proposed" },
  'Cancelled': { color: "bg-gray-100 text-gray-800", label: "Cancelled" },
};

const ProjectPaymentStatusCard = ({ project, isEditing, onFieldChange }: ProjectPaymentStatusCardProps) => {
  const paymentBadgeColor = paymentStatusConfig[project.payment_status]?.color || "bg-gray-100 text-gray-800";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
        <CreditCard className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Select
            value={project.payment_status}
            onValueChange={(value) => onFieldChange('payment_status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a payment status" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="pt-2">
            <Badge variant="outline" className={cn("font-normal", paymentBadgeColor)}>
              {project.payment_status}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectPaymentStatusCard;