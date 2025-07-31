import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TeamSelector from "./TeamSelector";
import FileUploader from "./FileUploader";
import { Project, AssignedUser, ProjectFile } from "@/data/projects";
import { dummyProjects } from "@/data/projects";
import { useNavigate } from "react-router-dom";

const ProjectDetailsForm = () => {
  const [projectName, setProjectName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [team, setTeam] = useState<AssignedUser[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProjectFiles: ProjectFile[] = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
    }));

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectName,
      category: category,
      description: description,
      assignedTo: team,
      briefFiles: newProjectFiles,
      status: "Requested",
      progress: 0,
      budget: 0,
      deadline: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
      paymentStatus: "proposed",
      createdBy: {
        id: "user-current",
        name: "Current User",
        initials: "CU",
      },
      tickets: 0,
    };

    // In a real app, you'd send this to a server.
    // For this demo, we'll add it to our dummy data.
    dummyProjects.push(newProject);
    console.log("New Project Submitted:", newProject);
    navigate(`/projects/${newProject.id}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Fill out the form below to create a new project request.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="e.g., New Marketing Website"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select onValueChange={setCategory} value={category}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Web Development">Web Development</SelectItem>
                <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                <SelectItem value="Branding">Branding</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              placeholder="Provide a detailed description of the project requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>
          <div className="space-y-2">
            <Label>Assign Team</Label>
            <TeamSelector selectedUsers={team} onSelectedUsersChange={setTeam} />
          </div>
          <div className="space-y-2">
            <Label>Attach Files</Label>
            <FileUploader onFilesChange={setFiles} />
          </div>
          <Button type="submit" className="w-full">Submit Project Request</Button>
        </CardContent>
      </Card>
    </form>
  );
};

export default ProjectDetailsForm;