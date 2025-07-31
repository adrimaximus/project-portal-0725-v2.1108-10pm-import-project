import PortalLayout from "@/components/PortalLayout";
import { dummyProjects, Project } from "@/data/projects";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

const StatusBadge = ({ status }: { status: Project['status'] }) => {
  const variants = {
    'On Track': 'default',
    'At Risk': 'secondary',
    'Off Track': 'destructive',
    'Completed': 'outline',
  } as const;
  return <Badge variant={variants[status]}>{status}</Badge>;
};

const PaymentStatusBadge = ({ status }: { status: Project['paymentStatus'] }) => {
    const variants = {
    'Paid': 'outline',
    'Pending': 'secondary',
    'Overdue': 'destructive',
  } as const;
  return <Badge variant={variants[status]}>{status}</Badge>;
};

const Rating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <PortalLayout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Welcome to your Portal</h1>
          <p className="text-xl text-muted-foreground mt-2">Here's a quick overview of your projects.</p>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Project Owner</TableHead>
                <TableHead>Project Status</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Project Progress</TableHead>
                <TableHead>Project Value</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Payment Due</TableHead>
                <TableHead>Active Tickets</TableHead>
                <TableHead>Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyProjects.map((project) => (
                <TableRow
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="font-medium">{project.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={project.owner.avatar} alt={project.owner.name} />
                        <AvatarFallback>{project.owner.initials}</AvatarFallback>
                      </Avatar>
                      <span>{project.owner.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={project.status} />
                  </TableCell>
                  <TableCell>
                    <PaymentStatusBadge status={project.paymentStatus} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress} className="w-20" />
                      <span>{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(project.value)}</TableCell>
                  <TableCell>{formatDate(project.startDate)}</TableCell>
                  <TableCell>{formatDate(project.dueDate)}</TableCell>
                  <TableCell>{formatDate(project.paymentDue)}</TableCell>
                  <TableCell className="text-center">{project.activeTickets}</TableCell>
                  <TableCell>
                    <Rating rating={project.rating} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </PortalLayout>
  );
};

export default Index;