import PortalLayout from "@/components/PortalLayout";
import SonioxSettingsForm from "@/components/integrations/SonioxSettingsForm";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const SpeechToTextPage = () => {
  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/settings">Settings</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/settings/integrations">Integrations</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Speech to Text</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Speech to Text Integration
          </h1>
          <p className="text-muted-foreground">
            Manage your speech-to-text service settings.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Soniox Configuration</CardTitle>
            <CardDescription>
              Configure your Soniox speech-to-text provider and settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SonioxSettingsForm />
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default SpeechToTextPage;