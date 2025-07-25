"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Ticket as TicketIcon } from "lucide-react";
import { Ticket } from "../types";

interface ProjectTicketsProps {
  tickets: Ticket[];
}

const statusColors: { [key: string]: string } = {
  Open: "bg-green-500",
  "In Progress": "bg-yellow-500",
  Closed: "bg-gray-500",
};

const ProjectTickets = ({ tickets }: ProjectTicketsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
            <TicketIcon className="h-12 w-12 mb-4 text-gray-400" />
            <p className="font-semibold">No Tickets Yet</p>
            <p className="text-sm">Create a ticket from the comments section.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="flex items-start gap-4 p-3 rounded-lg border">
                <Avatar className="h-9 w-9 border">
                  <AvatarImage src={ticket.user.avatar} alt={ticket.user.name} />
                  <AvatarFallback>{ticket.user.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                </Avatar>
                <div className="grid gap-1.5 w-full">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{ticket.user.name}</p>
                    <Badge variant="secondary" className="capitalize">
                      <div className={`h-2 w-2 rounded-full mr-2 ${statusColors[ticket.status]}`} />
                      {ticket.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{ticket.text}</p>
                  <p className="text-xs text-muted-foreground pt-1">{ticket.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectTickets;