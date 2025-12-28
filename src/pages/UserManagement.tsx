import PortalLayout from "@/components/PortalLayout";
import { useProfiles } from "@/hooks/useProfiles";
import { useAuth } from "@/contexts/AuthContext";
import UserGrid from "@/components/users/UserGrid";
import { Loader2 } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";

const UserManagementPage = () => {
  const { data: users = [], isLoading } = useProfiles();
  const { onlineCollaborators } = useAuth();

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link to="/dashboard">Dashboard</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>User Directory</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Directory</h1>
          <p className="text-muted-foreground">
            Browse all members of your workspace.
          </p>
        </div>

        {isLoading ? (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <UserGrid users={users} onlineCollaborators={onlineCollaborators} />
        )}
      </div>
    </PortalLayout>
  );
};

export default UserManagementPage;