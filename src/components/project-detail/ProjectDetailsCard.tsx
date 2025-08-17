import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/types";
import { Calendar, Wallet, Briefcase } from "lucide-react";
import { format } from "date-fns";

interface ProjectDetailsCardProps {
  project: Project;
}

const ProjectDetailsCard = ({ project }: ProjectDetailsCardProps) => {
  const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex items-start gap-4">
          <Calendar className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">Timeline</p>
            <p className="text-muted-foreground">
              {format(new Date(project.startDate || Date.now()), "dd MMM yyyy")} - {format(new Date(project.dueDate), "dd MMM yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <Wallet className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">Budget</p>
            <p className="text-muted-foreground">
              {formatCurrency(project.budget || 0)}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <Briefcase className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
          <div>
            <p className="font-medium">Services</p>
            <p className="text-muted-foreground">
              {(project.services || []).join(", ")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectDetailsCard;