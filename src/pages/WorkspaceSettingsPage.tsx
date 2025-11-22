import PortalLayout from "@/components/PortalLayout";
import { useFeatures } from "@/contexts/FeaturesContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

const WorkspaceSettingsPage = () => {
  const { features, toggleFeatureStatus, isLoading } = useFeatures();

  // Added 'expense' to the list of features to display
  const workspaceFeatures = [
    'billing', 'chat', 'dashboard', 'goals', 'knowledge-base', 
    'mood-tracker', 'people', 'projects', 'request', 'search', 'integrations', 'tasks', 'expense'
  ];

  const featuresToDisplay = features
    .filter(f => workspaceFeatures.includes(f.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/settings">Settings</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Workspace Settings</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workspace Settings</h1>
          <p className="text-muted-foreground">
            Enable or disable features for all users in the workspace.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Feature Management</CardTitle>
            <CardDescription>
              Toggling a feature off here will disable it for all users, regardless of their role permissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : featuresToDisplay.map(feature => (
              <div key={feature.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor={`feature-${feature.id}`} className="text-base">{feature.name}</Label>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
                <Switch
                  id={`feature-${feature.id}`}
                  checked={feature.is_enabled}
                  onCheckedChange={() => toggleFeatureStatus(feature.id, feature.is_enabled)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default WorkspaceSettingsPage;