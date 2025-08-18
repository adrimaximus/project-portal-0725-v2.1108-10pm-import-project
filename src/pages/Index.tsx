import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types";
import { DollarSign, Package, Users, CreditCard } from "lucide-react";

import StatCard from "@/components/dashboard/StatCard";
import ProjectFilters from "@/components/dashboard/ProjectFilters";
import { ProjectList } from "@/components/projects/ProjectList";
import { ProjectListSkeleton } from "@/components/projects/ProjectListSkeleton";

const fetchDashboardProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase.rpc("get_dashboard_projects");
  if (error) throw new Error(error.message);
  return data || [];
};

const Index = () => {
  const { data: projects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ["dashboardProjects"],
    queryFn: fetchDashboardProjects,
  });

  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("All");

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const statusMatch =
        statusFilter === "All" || project.status === statusFilter;
      const paymentStatusMatch =
        paymentStatusFilter === "All" ||
        project.payment_status === paymentStatusFilter;
      return statusMatch && paymentStatusMatch;
    });
  }, [projects, statusFilter, paymentStatusFilter]);

  const totalProjects = projects.length;
  const totalRevenue = projects.reduce((acc, project) => acc + (project.budget || 0), 0);
  const activeProjects = projects.filter(p => p.status === 'In Progress').length;
  const unpaidInvoices = projects.filter(p => p.payment_status === 'Unpaid').length;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          description="Total revenue from all projects"
        />
        <StatCard
          title="Total Projects"
          value={totalProjects}
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
          description="Total number of projects"
        />
        <StatCard
          title="Active Projects"
          value={activeProjects}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          description="Projects currently in progress"
        />
        <StatCard
          title="Unpaid Invoices"
          value={unpaidInvoices}
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
          description="Projects with unpaid status"
        />
      </div>
      
      <div className="space-y-4">
        <ProjectFilters
          statusFilter={statusFilter}
          paymentStatusFilter={paymentStatusFilter}
          onStatusFilterChange={(value) => setStatusFilter(value === "All" ? "All" : value)}
          onPaymentStatusFilterChange={(value) => setPaymentStatusFilter(value === "All" ? "All" : value)}
        />
        
        {isLoading ? (
          <ProjectListSkeleton />
        ) : error ? (
          <div className="text-center text-red-500">
            Failed to load projects: {(error as Error).message}
          </div>
        ) : (
          <ProjectList projects={filteredProjects} />
        )}
      </div>
    </div>
  );
};

export default Index;