import { DollarSign, Package, Users, Activity } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import PortalLayout from "@/components/PortalLayout";

const Dashboard = () => {
  const totalProjects = 12;
  const totalBudgetValue = 250000000;
  const activeProjects = 9;
  const teamMembers = 5;

  const recentProjects = [
    {
      id: "1",
      name: "Website Redesign",
      category: "Web Development",
      budget: 50000000,
      avatar: "/avatars/01.png",
      initials: "WR",
    },
    {
      id: "2",
      name: "Mobile App Launch",
      category: "Marketing",
      budget: 75000000,
      avatar: "/avatars/02.png",
      initials: "ML",
    },
    {
      id: "3",
      name: "API Integration",
      category: "Backend",
      budget: 30000000,
      avatar: "/avatars/03.png",
      initials: "AI",
    },
  ];

  return (
    <PortalLayout>
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Projects"
            value={totalProjects}
            icon={<Package className="h-4 w-4 text-muted-foreground" />}
            description={`${activeProjects} active`}
          />
          <StatCard
            title="Total Project Value"
            value={new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(totalBudgetValue)}
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            description="Sum of all project budgets"
          />
          <StatCard
            title="Active Projects"
            value={activeProjects}
            icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            description="Projects currently in progress"
          />
          <StatCard
            title="Team Members"
            value={teamMembers}
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            description="Unique users across all projects"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {recentProjects.map((project) => (
                  <Link to={`/projects/${project.id}`} key={project.id} className="flex items-center hover:bg-muted/50 p-2 rounded-lg">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={project.avatar} alt="Avatar" />
                      <AvatarFallback>{project.initials}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.category}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(project.budget)}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
};

export default Dashboard;