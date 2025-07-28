import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, FileText, CheckCircle, Clock, XCircle, FileClock, BadgeDollarSign, FileCheck, FileX, Download, Trash2, Pencil } from "lucide-react";
import { Project } from "@/data/projects";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Progress } from "./ui/progress";
import { useNavigate } from "react-router-dom";

interface ProjectsTableProps {
  projects: Project[];
  onDelete: (projectId: string) => void;
}

type PaymentStatusInfo = {
  icon: JSX.Element;
  label: string;
  variant: BadgeProps["variant"];
  className?: string;
};

const getStatusIcon = (status: Project["status"]) => {
  switch (status) {
    case "Done":
    case "Completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "Billed":
      return <FileCheck className="h-4 w-4 text-blue-500" />;
    case "On Going":
    case "In Progress":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "On Hold":
      return <FileClock className="h-4 w-4 text-gray-500" />;
    case "Cancelled":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
  }
};

const getPaymentStatusInfo = (status: Project["paymentStatus"]): PaymentStatusInfo => {
  switch (status) {
    case "paid":
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        label: "Paid",
        variant: "default",
        className: "bg-green-100 text-green-800",
      };
    case "pending":
      return {
        icon: <Clock className="h-4 w-4 text-yellow-500" />,
        label: "Pending",
        variant: "secondary",
        className: "bg-yellow-100 text-yellow-800",
      };
    case "proposed":
      return {
        icon: <FileText className="h-4 w-4 text-gray-500" />,
        label: "Proposed",
        variant: "outline",
      };
    case "approved":
        return {
            icon: <FileCheck className="h-4 w-4 text-blue-500" />,
            label: "Approved",
            variant: "secondary",
            className: "bg-blue-100 text-blue-800",
        };
    case "po_created":
        return {
            icon: <BadgeDollarSign className="h-4 w-4 text-indigo-500" />,
            label: "PO Created",
            variant: "secondary",
            className: "bg-indigo-100 text-indigo-800",
        };
    case "on_process":
        return {
            icon: <Clock className="h-4 w-4 text-purple-500" />,
            label: "On Process",
            variant: "secondary",
            className: "bg-purple-100 text-purple-800",
        };
    case "cancelled":
        return {
            icon: <FileX className="h-4 w-4 text-red-500" />,
            label: "Cancelled",
            variant: "destructive",
            className: "bg-red-100 text-red-800",
        };
    default:
      return {
        icon: <FileText className="h-4 w-4 text-gray-500" />,
        label: "Unknown",
        variant: "outline",
      };
  }
};

const ProjectsTable = ({ projects, onDelete }: ProjectsTableProps) => {
  const navigate = useNavigate();

  const handleViewDetails = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Assigned to</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const paymentInfo = getPaymentStatusInfo(project.paymentStatus);
            return (
              <TableRow key={project.id} className="cursor-pointer" onClick={() => handleViewDetails(project.id)}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{project.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {project.services.join(", ")}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {project.assignedTo.map((user) => (
                      <Tooltip key={user.id}>
                        <TooltipTrigger asChild>
                          <Avatar className="border-2 border-background">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{user.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(project.status)}
                    <span>{project.status}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="w-24" />
                    <span className="text-sm text-muted-foreground">{project.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={paymentInfo.variant} className={paymentInfo.className}>
                    {paymentInfo.icon}
                    <span className="ml-1">{paymentInfo.label}</span>
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(project.deadline), "MMM dd, yyyy")}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleViewDetails(project.id)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        View/Edit Details
                      </DropdownMenuItem>
                      {project.invoiceAttachmentUrl && (
                        <DropdownMenuItem asChild>
                          <a href={project.invoiceAttachmentUrl} download>
                            <Download className="mr-2 h-4 w-4" />
                            Download Invoice
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={() => onDelete(project.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
};

export default ProjectsTable;