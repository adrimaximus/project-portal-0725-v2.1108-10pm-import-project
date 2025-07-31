import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from "@/data/projects";
import { format, differenceInDays, isPast } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Badge, BadgeProps } from "../ui/badge";
import { cn } from "@/lib/utils";

interface ProjectInfoCardsProps {
  project: Project;
}

const getStatusBadgeVariant = (status: Project["status"]): BadgeProps["variant"] => {
  switch (status) {
    case "Completed":
    case "Done":
    case "Billed":
      return "default";
    case "On Track":
    case "In Progress":
      return "success";
    case "At Risk":
    case "On Hold":
      return "secondary"; // Mapped from warning
    case "Off Track":
    case "Cancelled":
      return "destructive";
    default:
      return "secondary";
  }
};

const getPaymentStatusBadgeVariant = (status: Project["paymentStatus"]): BadgeProps["variant"] => {
  switch (status) {
    case "Paid":
    case "paid":
    case "approved":
    case "po_created":
    case "on_process":
      return "success";
    case "Pending":
    case "pending":
      return "secondary"; // Mapped from warning
    case "Overdue":
    case "cancelled":
      return "destructive";
    case "proposed":
    default:
      return "secondary";
  }
};

const getPaymentDueDateInfo = (project: Project) => {
  if (project.paymentStatus === "po_created" || project.paymentStatus === "on_process") {
    return { text: "On Process", className: "text-gray-500" };
  }
  if (!project.paymentDue) {
    return { text: "Not Set", className: "text-gray-500" };
  }

  const dueDate = new Date(project.paymentDue);
  const now = new Date();
  const daysDifference = differenceInDays(dueDate, now);

  if (isPast(dueDate) && project.paymentStatus !== "Paid" && project.paymentStatus !== "paid") {
    return {
      text: `Overdue by ${Math.abs(daysDifference)} days`,
      className: "text-red-500 font-semibold",
    };
  }

  if (daysDifference <= 7 && project.paymentStatus !== "Paid" && project.paymentStatus !== "paid") {
    return {
      text: `Due in ${daysDifference} days`,
      className: "text-orange-500 font-semibold",
    };
  }

  return {
    text: `Due on ${format(dueDate, "d MMM yyyy")}`,
    className: "text-gray-500",
  };
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

export function ProjectInfoCards({ project }: ProjectInfoCardsProps) {
  const deadlineDate = new Date(project.dueDate);
  const paymentDueDateInfo = getPaymentDueDateInfo(project);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Project Value</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(project.value)}</div>
          <p className="text-xs text-muted-foreground">
            Total budget for the project
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Project Status</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </CardHeader>
        <CardContent>
          <Badge variant={getStatusBadgeVariant(project.status)}>
            {project.status}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            Current state of the project
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Project Deadline</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {format(deadlineDate, "d MMM yyyy", { locale: idLocale })}
          </div>
          <p className="text-xs text-muted-foreground">
            {differenceInDays(deadlineDate, new Date()) >= 0
              ? `${differenceInDays(deadlineDate, new Date())} days remaining`
              : `Overdue by ${Math.abs(
                  differenceInDays(deadlineDate, new Date())
                )} days`}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payment Due</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className={cn("text-lg font-bold", paymentDueDateInfo.className)}>
            {paymentDueDateInfo.text}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
            <span>Status</span>
            <Badge variant={getPaymentStatusBadgeVariant(project.paymentStatus)}>
              {project.paymentStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}