import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/data/projects";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, FileCheck, FileClock, FileText, FileX, XCircle, BadgeDollarSign } from "lucide-react";

interface ProjectInfoCardsProps {
  project: Project;
}

const getStatusInfo = (status: Project["status"]) => {
  switch (status) {
    case "Done":
    case "Completed":
      return { icon: <CheckCircle className="h-4 w-4 text-green-500" />, label: "Completed" };
    case "Billed":
      return { icon: <FileCheck className="h-4 w-4 text-blue-500" />, label: "Billed" };
    case "On Going":
    case "In Progress":
      return { icon: <Clock className="h-4 w-4 text-yellow-500" />, label: "In Progress" };
    case "On Hold":
      return { icon: <FileClock className="h-4 w-4 text-gray-500" />, label: "On Hold" };
    case "Cancelled":
      return { icon: <XCircle className="h-4 w-4 text-red-500" />, label: "Cancelled" };
    default:
      return { icon: <FileText className="h-4 w-4 text-gray-500" />, label: "Requested" };
  }
};

const getPaymentStatusInfo = (status: Project["paymentStatus"]) => {
    switch (status) {
      case "paid":
        return { icon: <CheckCircle className="h-4 w-4 text-green-500" />, label: "Paid", variant: "default", className: "bg-green-100 text-green-800" };
      case "pending":
        return { icon: <Clock className="h-4 w-4 text-yellow-500" />, label: "Pending", variant: "secondary", className: "bg-yellow-100 text-yellow-800" };
      case "proposed":
        return { icon: <FileText className="h-4 w-4 text-gray-500" />, label: "Proposed", variant: "outline" };
      case "approved":
          return { icon: <FileCheck className="h-4 w-4 text-blue-500" />, label: "Approved", variant: "secondary", className: "bg-blue-100 text-blue-800" };
      case "po_created":
          return { icon: <BadgeDollarSign className="h-4 w-4 text-indigo-500" />, label: "PO Created", variant: "secondary", className: "bg-indigo-100 text-indigo-800" };
      case "on_process":
          return { icon: <Clock className="h-4 w-4 text-purple-500" />, label: "On Process", variant: "secondary", className: "bg-purple-100 text-purple-800" };
      case "cancelled":
          return { icon: <FileX className="h-4 w-4 text-red-500" />, label: "Cancelled", variant: "destructive", className: "bg-red-100 text-red-800" };
      default:
        return { icon: <FileText className="h-4 w-4 text-gray-500" />, label: "Unknown", variant: "outline" };
    }
  };

const ProjectInfoCards = ({ project }: ProjectInfoCardsProps) => {
  const statusInfo = getStatusInfo(project.status);
  const paymentInfo = getPaymentStatusInfo(project.paymentStatus);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Status</CardTitle>
          {statusInfo.icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statusInfo.label}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget</CardTitle>
          <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(project.budget)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
          {paymentInfo.icon}
        </CardHeader>
        <CardContent>
          <Badge variant={paymentInfo.variant} className={paymentInfo.className}>
            {paymentInfo.label}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectInfoCards;