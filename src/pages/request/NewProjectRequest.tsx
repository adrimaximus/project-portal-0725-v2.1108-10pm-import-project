import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import PortalLayout from "@/components/PortalLayout";
import ServiceSelection from "@/components/request/ServiceSelection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProjectWithServices } from "@/api/projects";
import { Service } from "@/types";
import { Loader2 } from "lucide-react";

const NewProjectRequest = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

  const handleServiceSelect = (service: Service) => {
    setSelectedServices((prev) => {
      const isSelected = prev.some((s) => s.title === service.title);
      if (isSelected) {
        return prev.filter((s) => s.title !== service.title);
      } else {
        return [...prev, service];
      }
    });
  };

  const createProjectMutation = useMutation<{ id: string }, Error, void>({
    mutationFn: () => createProjectWithServices(
      { name: projectName, description: projectDescription, category: 'General' },
      selectedServices
    ),
    onSuccess: (data) => {
      toast.success("Project created successfully!");
      navigate(`/projects/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create project: ${error.message}`);
    },
  });

  const canSubmit = projectName && selectedServices.length > 0 && !createProjectMutation.isPending;

  return (
    <PortalLayout>
      <div className="space-y-6 pb-24">
        <Card>
          <CardHeader>
            <CardTitle>Create a New Project</CardTitle>
            <CardDescription>Start by giving your project a name and a brief description.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., New Marketing Website"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Project Description (Optional)</Label>
              <Textarea
                id="project-description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Briefly describe what this project is about."
              />
            </div>
          </CardContent>
        </Card>

        <ServiceSelection
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          selectedServices={selectedServices}
          onServiceSelect={handleServiceSelect}
        />
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4 lg:ml-64">
        <div className="max-w-5xl mx-auto flex justify-end">
            <Button
              onClick={() => createProjectMutation.mutate()}
              disabled={!canSubmit}
              size="lg"
            >
              {createProjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
        </div>
      </div>
    </PortalLayout>
  );
};

export default NewProjectRequest;