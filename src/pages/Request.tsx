import { Button } from "@/components/ui/button";
import PortalLayout from "@/components/PortalLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { dummyProjects, Project } from "@/data/projects";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

export default function Request() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newProjectData = Object.fromEntries(formData.entries());

    const newProject: Project = {
      id: `PROJ-${Math.floor(Math.random() * 900) + 100}`,
      name: newProjectData.name as string,
      description: newProjectData.description as string,
      budget: Number(newProjectData.budget),
      startDate: new Date().toISOString().split("T")[0],
      deadline: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0],
      progress: 0,
      status: "Pending",
      assignedTo: [
        {
          name: "Admin Review",
          avatar: "https://i.pravatar.cc/150?u=admin",
        }
      ],
      services: [],
    };

    dummyProjects.push(newProject);

    toast({
      title: "Request Submitted",
      description: "Your new project request has been submitted for review.",
    });

    navigate("/");
  };

  return (
    <PortalLayout>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Project Request</h1>
          <p className="text-muted-foreground">
            Fill out the form below to submit a new project.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Project Name</Label>
          <Input id="name" name="name" placeholder="e.g., E-commerce Platform" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" placeholder="Provide a brief description of the project." required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget">Budget (IDR)</Label>
          <Input id="budget" name="budget" type="number" placeholder="e.g., 50000000" required />
        </div>
        <Button type="submit">Submit Request</Button>
      </form>
    </PortalLayout>
  );
}