import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectDetailsForm } from "@/components/request/ProjectDetailsForm";
import ModernTeamSelector from "@/components/request/ModernTeamSelector";
import ServiceSelector from "@/components/request/ServiceSelector";
import FileUploader from "@/components/request/FileUploader";

const Request = () => {
  return (
    <PortalLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Submit a New Project Request</h1>
          <p className="text-muted-foreground">Fill out the details below to get your project started.</p>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>The what, why, and who of your project.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectDetailsForm />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
              <CardDescription>Select the team members for this project.</CardDescription>
            </CardHeader>
            <CardContent>
              <ModernTeamSelector />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
              <CardDescription>Choose the services required for this project.</CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceSelector />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Project Brief & Files</CardTitle>
              <CardDescription>Upload any relevant documents.</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader />
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button size="lg">Submit Request</Button>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default Request;