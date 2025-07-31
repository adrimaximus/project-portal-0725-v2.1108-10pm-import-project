import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Project, User, File as ProjectFile } from "@/data/projects";
import { Service, services } from "@/data/services";
import { ServiceSelector } from "./ServiceSelector";
import { TeamSelector } from "./TeamSelector";
import { FileUploader } from "./FileUploader";
import { DatePicker } from "../ui/date-picker";
import { useToast } from "../ui/use-toast";
import { dummyUsers } from "@/data/users";

interface ProjectDetailsFormProps {
  onFormSubmit: (project: Project) => void;
}

export function ProjectDetailsForm({ onFormSubmit }: ProjectDetailsFormProps) {
  const { toast } = useToast();
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<User[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [deadline, setDeadline] = useState<Date | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !projectDescription || !deadline) {
      toast({
        title: "Incomplete Form",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }

    const projectFiles: ProjectFile[] = uploadedFiles.map(file => ({
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      url: '#', // Placeholder URL
    }));

    const projectServices: Project['services'] = selectedServices.map(s => ({
        name: s.title,
        price: s.price,
    }));

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectName,
      description: projectDescription,
      owner: dummyUsers[0], // Placeholder for current user
      createdBy: dummyUsers[0], // Placeholder
      status: "Requested",
      progress: 0,
      category: selectedServices.map(s => s.category).join(', ') || 'General',
      assignedTo: selectedTeam,
      startDate: new Date().toISOString(),
      dueDate: deadline.toISOString(),
      deadline: deadline.toISOString(),
      paymentStatus: "proposed",
      value: projectServices.reduce((sum, s) => sum + s.price, 0),
      budget: projectServices.reduce((sum, s) => sum + s.price, 0),
      paymentDue: "",
      paymentDueDate: "",
      rating: 0,
      activeTickets: 0,
      briefFiles: projectFiles,
      services: projectServices,
      tasks: [],
      tickets: [],
      activity: [],
    };

    onFormSubmit(newProject);
    toast({
      title: "Project Requested",
      description: "Your new project has been submitted for approval.",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="project-name">Project Name</Label>
        <Input
          id="project-name"
          placeholder="e.g., New Marketing Website"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-description">Project Description</Label>
        <Textarea
          id="project-description"
          placeholder="Describe the project goals, deliverables, and requirements."
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Services</Label>
        <ServiceSelector
          services={services}
          selectedServices={selectedServices}
          onSelectionChange={setSelectedServices}
        />
      </div>

      <div className="space-y-2">
        <Label>Team</Label>
        <TeamSelector
          selectedUsers={selectedTeam}
          onSelectionChange={setSelectedTeam}
        />
      </div>

      <div className="space-y-2">
        <Label>Brief & Files</Label>
        <FileUploader onFilesUpload={setUploadedFiles} />
      </div>

      <div className="space-y-2">
        <Label>Deadline</Label>
        <DatePicker date={deadline} setDate={setDeadline} />
      </div>

      <Button type="submit" className="w-full">
        Submit Project Request
      </Button>
    </form>
  );
}