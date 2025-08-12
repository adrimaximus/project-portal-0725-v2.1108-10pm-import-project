import { useState } from "react";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import PortalLayout from "@/components/PortalLayout";
import { Project } from "@/data/projects";
import DashboardStatsGrid from "@/components/dashboard/DashboardStatsGrid";
import CollaboratorsList from "@/components/dashboard/CollaboratorsList";

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    category: 'Web Development',
    description: 'Complete redesign of the company website.',
    status: 'In Progress',
    progress: 75,
    budget: 120000000,
    startDate: new Date(new Date().getFullYear(), 0, 15).toISOString(),
    dueDate: new Date(new Date().getFullYear(), 5, 30).toISOString(),
    paymentStatus: 'Paid',
    createdBy: { id: 'user-1', name: 'Andi', email: 'andi@example.com', avatar: 'https://i.pravatar.cc/150?u=andi', initials: 'A' },
    assignedTo: [
      { id: 'user-2', name: 'Budi', email: 'budi@example.com', avatar: 'https://i.pravatar.cc/150?u=budi', initials: 'B', role: 'Developer' },
      { id: 'user-3', name: 'Citra', email: 'citra@example.com', avatar: 'https://i.pravatar.cc/150?u=citra', initials: 'C', role: 'Designer' },
    ],
    tasks: [],
    comments: [],
  },
  {
    id: '2',
    name: 'Mobile App Launch',
    category: 'Mobile Development',
    description: 'Launch of the new mobile application.',
    status: 'Completed',
    progress: 100,
    budget: 250000000,
    startDate: new Date(new Date().getFullYear(), 2, 1).toISOString(),
    dueDate: new Date(new Date().getFullYear(), 8, 15).toISOString(),
    paymentStatus: 'Paid',
    createdBy: { id: 'user-3', name: 'Citra', email: 'citra@example.com', avatar: 'https://i.pravatar.cc/150?u=citra', initials: 'C' },
    assignedTo: [
      { id: 'user-1', name: 'Andi', email: 'andi@example.com', avatar: 'https://i.pravatar.cc/150?u=andi', initials: 'A', role: 'Manager' },
    ],
    tasks: [],
    comments: [],
  },
  {
    id: '3',
    name: 'Marketing Campaign',
    category: 'Marketing',
    description: 'Q3 Marketing Campaign.',
    status: 'On Hold',
    progress: 20,
    budget: 50000000,
    startDate: new Date(new Date().getFullYear(), 6, 1).toISOString(),
    dueDate: new Date(new Date().getFullYear(), 8, 31).toISOString(),
    paymentStatus: 'Pending',
    createdBy: { id: 'user-1', name: 'Andi', email: 'andi@example.com', avatar: 'https://i.pravatar.cc/150?u=andi', initials: 'A' },
    assignedTo: [
      { id: 'user-4', name: 'Dewi', email: 'dewi@example.com', avatar: 'https://i.pravatar.cc/150?u=dewi', initials: 'D', role: 'Specialist' },
    ],
    tasks: [],
    comments: [],
  },
];

const Index = () => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(new Date().getFullYear(), 11, 31),
  });
  const [projects] = useState<Project[]>(mockProjects);
  
  // Mock user object
  const user = { name: "Andi" };

  const filteredProjects = projects.filter(project => {
    if (date?.from && project.startDate) {
        const projectStart = new Date(project.startDate);
        const pickerFrom = date.from;
        const pickerTo = date.to || date.from;

        if (project.dueDate) {
            const projectEnd = new Date(project.dueDate);
            return projectStart <= pickerTo && projectEnd >= pickerFrom;
        }
        return projectStart >= pickerFrom && projectStart <= pickerTo;
    }
    return true;
  });

  return (
    <PortalLayout>
      <div className="space-y-8">
        <div className="text-left">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Hey {user.name}, have a good day! 👋</h1>
          <p className="text-lg sm:text-xl text-muted-foreground mt-2">Here's a quick overview of your projects.</p>
        </div>

        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold">Insights</h2>
                <DateRangePicker date={date} onDateChange={setDate} />
            </div>
            <DashboardStatsGrid projects={filteredProjects} />
            <CollaboratorsList projects={filteredProjects} />
        </div>
      </div>
    </PortalLayout>
  );
};

export default Index;