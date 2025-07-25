"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProjectComments from "@/components/ProjectComments";
import ProjectTickets from "@/components/ProjectTickets";
import { Ticket } from "../types";

// Placeholder data for the detail page
const projectData = {
  name: "Website Redesign",
  description: "A complete overhaul of the company website with a new design system, focusing on improved user experience and mobile-first design.",
};

const ProjectFilesPlaceholder = () => (
  <Card>
    <CardHeader><CardTitle>Project Files</CardTitle></CardHeader>
    <CardContent><p className="text-muted-foreground">Project files will be listed here.</p></CardContent>
  </Card>
);

const ProjectDetail = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const addTicket = (ticketText: string) => {
    const newTicket: Ticket = {
      id: tickets.length + 1,
      text: ticketText,
      user: {
        name: "You",
        avatar: "https://i.pravatar.cc/150?u=currentuser",
      },
      timestamp: "Just now",
      status: 'Open',
    };
    setTickets(prevTickets => [...prevTickets, newTicket]);
  };

  return (
    <main className="flex-1 p-4 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{projectData.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{projectData.description}</p>
            </CardContent>
          </Card>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <ProjectFilesPlaceholder />
              <ProjectTickets tickets={tickets} />
            </div>
            <div className="space-y-6">
              {/* Placeholder for another component or can be removed */}
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <ProjectComments onAddTicket={addTicket} />
        </div>
      </div>
    </main>
  );
};

export default ProjectDetail;