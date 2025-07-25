import { Request, RequestStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface RequestCardProps {
  request: Request;
}

const statusColors: Record<RequestStatus, string> = {
  Pending: "bg-yellow-500 hover:bg-yellow-500/90",
  "In Progress": "bg-blue-500 hover:bg-blue-500/90",
  Completed: "bg-green-500 hover:bg-green-500/90",
  Rejected: "bg-red-500 hover:bg-red-500/90",
};

const RequestCard = ({ request }: RequestCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold leading-tight pr-4">{request.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Change Status</DropdownMenuItem>
              <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Badge variant="secondary">{request.type}</Badge>
          <Badge className={cn("text-white", statusColors[request.status])}>{request.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={request.avatar} alt={request.submittedBy} />
              <AvatarFallback>{request.submittedBy.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{request.submittedBy}</span>
          </div>
          <span>{new Date(request.date).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestCard;