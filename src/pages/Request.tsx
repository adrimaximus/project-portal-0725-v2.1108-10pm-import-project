import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dummyProjects, Project } from "@/data/projects";
import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Request = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const projectName = formData.get("projectName");
    const clientName = formData.get("clientName");
    const deadline = formData.get("deadline");
    const budget = formData.get("budget");

    if (!projectName || !clientName || !deadline || !budget) {
      setError("Please fill out all required fields.");
      return;
    }

    const newProject: Project = {
      id: `PRJ-${String(dummyProjects.length + 1).padStart(3, '0')}`,
      name: projectName as string,
      client: clientName as string,
      startDate: new Date().toISOString().split('T')[0],
      deadline: deadline as string,
      status: "Requested",
      budget: Number(budget),
      paymentStatus: "Pending",
      assignedTo: [
        { name: "Frank", status: 'Online' },
        { name: "Grace", status: 'Offline' }
      ],
      description: formData.get("description") as string,
      services: (formData.get("services") as string).split(',').map(s => s.trim()),
    };

    dummyProjects.push(newProject);
    toast.success("New project request has been submitted successfully!");
    navigate("/");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-2xl p-8 space-y-8 bg-card text-card-foreground rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Submit a Project Request</h1>
          <p className="text-muted-foreground">Fill out the form below to get started.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Input id="projectName" name="projectName" placeholder="e.g., E-commerce Website" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input id="clientName" name="clientName" placeholder="e.g., Tech Solutions Inc." required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" name="deadline" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (IDR)</Label>
              <Input id="budget" name="budget" type="number" placeholder="e.g., 50000000" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="services">Services Needed</Label>
            <Input id="services" name="services" placeholder="e.g., Web Development, UI/UX Design" />
            <p className="text-sm text-muted-foreground">Separate services with a comma.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Project Description</Label>
            <Textarea id="description" name="description" placeholder="Provide a brief overview of the project." />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">Submit Request</Button>
        </form>
      </div>
    </div>
  );
};

export default Request;