import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import ModernTeamSelector from "./ModernTeamSelector";
import FileUploader from "./FileUploader";
import { Project, AssignedUser, ProjectFile, dummyProjects } from "@/data/projects";
import { allUsers } from "@/data/users";
import { useNavigate } from "react-router-dom";
import { Service, services as allServicesData } from "@/data/services";
import { DateRange } from "react-day-picker";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ProjectDetailsFormProps {
  selectedServices: Service[];
  onBack: () => void;
}

const ProjectDetailsForm = ({ selectedServices, onBack }: ProjectDetailsFormProps) => {
  const { user: currentUser } = useAuth();
  const [projectName, setProjectName] = useState("");
  const [date, setDate] = useState<DateRange | undefined>();
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [team, setTeam] = useState<AssignedUser[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const navigate = useNavigate();

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (rawValue) {
      const formattedValue = new Intl.NumberFormat('id-ID').format(parseInt(rawValue));
      setBudget(`Rp ${formattedValue}`);
    } else {
      setBudget('');
    }
  };

  const handleTeamChange = (userToToggle: AssignedUser) => {
    setTeam((currentTeam) =>
      currentTeam.some((user) => user.id === userToToggle.id)
        ? currentTeam.filter((user) => user.id !== userToToggle.id)
        : [...currentTeam, userToToggle]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("You must be logged in to create a project.");
      return;
    }
    
    const newProjectFiles: ProjectFile[] = files.map(file => ({
      id: `file-${Date.now()}-${file.name}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
    }));

    const numericBudget = parseInt(budget.replace(/[^0-9]/g, ''), 10) || 0;
    const dueDate = date?.to ?? addDays(new Date(), 30);

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectName,
      category: selectedServices.length > 0 ? selectedServices[0].title : "General",
      description: description,
      assignedTo: team,
      briefFiles: newProjectFiles,
      status: "Requested",
      progress: 0,
      budget: numericBudget,
      startDate: date?.from?.toISOString() ?? new Date().toISOString(),
      dueDate: dueDate.toISOString(),
      paymentStatus: "Proposed",
      createdBy: currentUser as AssignedUser,
      services: selectedServices.map(s => s.title),
      tasks: [],
      comments: [],
      activities: [],
    };

    dummyProjects.push(newProject);
    navigate(`/projects/${newProject.id}`);
  };

  const serviceDetails = selectedServices
    .map((service) => allServicesData.find((s) => s.title === service.title))
    .filter((s): s is Service => s !== undefined);

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Fill out the form below to create a new project request.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 max-h-[60vh] overflow-y-auto">
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
            <Label>Selected Services</Label>
            <div className="flex flex-wrap gap-2 rounded-md border p-3 bg-muted/50 min-h-[40px]">
              {serviceDetails.length > 0 ? serviceDetails.map((service) => (
                <Badge key={service.title} variant="secondary" className="flex items-center gap-2">
                  <service.icon className={cn("h-4 w-4", service.iconColor)} />
                  <span>{service.title}</span>
                </Badge>
              )) : <p className="text-sm text-muted-foreground">No services selected. Go back to select services.</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date-range">Project Timeline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date-range"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Project Budget</Label>
              <Input
                id="budget"
                placeholder="e.g., Rp 10.000.000"
                value={budget}
                onChange={handleBudgetChange}
              />
            </div>
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
            <ModernTeamSelector users={allUsers} selectedUsers={team} onSelectionChange={handleTeamChange} />
          </div>
          <div className="space-y-2">
            <Label>Attach Files</Label>
            <FileUploader onFilesChange={setFiles} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onBack}>Back</Button>
          <Button type="submit">Submit Project Request</Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default ProjectDetailsForm;