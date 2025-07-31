import { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import ServiceSelection from "@/components/ServiceSelection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dummyProjects } from "@/data/projects";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

const RequestPage = () => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const allServices = [...new Set(dummyProjects.flatMap(p => p.services || []))].sort();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      projectName: formData.get("projectName"),
      projectDescription: formData.get("projectDescription"),
      services: selectedServices,
    };
    console.log("New Request Submitted:", data);
    toast({
      title: "Request Submitted!",
      description: "Your new project request has been received.",
    });
    navigate("/");
  };

  return (
    <PortalLayout>
      <div className="flex justify-center items-start py-12 px-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Submit a New Project Request</CardTitle>
            <CardDescription>Fill out the form below to request a new project.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input id="projectName" name="projectName" placeholder="e.g., New Marketing Website" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectDescription">Project Description</Label>
                <Textarea id="projectDescription" name="projectDescription" placeholder="Describe the project requirements in detail..." required />
              </div>
              <div className="space-y-2">
                <Label>Services Required</Label>
                <ServiceSelection
                  services={allServices}
                  selectedServices={selectedServices}
                  onSelectionChange={setSelectedServices}
                />
              </div>
              <Button type="submit" className="w-full">Submit Request</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default RequestPage;