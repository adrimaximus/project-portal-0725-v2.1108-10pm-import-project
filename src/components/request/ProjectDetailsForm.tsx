import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Service } from "@/data/services";
import { dummyProjects, Project, AssignedUser } from "@/data/projects";
import { ArrowLeft, Calendar as CalendarIcon, Paperclip, Wallet, CalendarDays, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CurrencyInput } from "@/components/ui/currency-input";
import RichTextEditor from "@/components/RichTextEditor";
import RequestComments from "@/components/request/RequestComments";
import TeamSelector from "./TeamSelector";

interface ProjectDetailsFormProps {
  selectedServices: Service[];
  onBack: () => void;
}

const ProjectDetailsForm = ({ selectedServices, onBack }: ProjectDetailsFormProps) => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [paymentDueDate, setPaymentDueDate] = useState<Date>();
  const [budget, setBudget] = useState<number | undefined>();
  const [briefFile, setBriefFile] = useState<File | null>(null);
  const [assignedTeam, setAssignedTeam] = useState<AssignedUser[]>([]);

  const isSubmitDisabled = !projectName || !projectDescription || selectedServices.length === 0 || !startDate || !endDate || !budget || assignedTeam.length === 0;

  const handleSubmitRequest = () => {
    if (isSubmitDisabled) {
      alert("Please fill all required fields.");
      return;
    }

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectName,
      description: projectDescription,
      status: "Requested",
      progress: 0,
      startDate: format(startDate as Date, "yyyy-MM-dd"),
      deadline: format(endDate as Date, "yyyy-MM-dd"),
      paymentDueDate: paymentDueDate ? format(paymentDueDate, "yyyy-MM-dd") : undefined,
      budget: budget as number,
      paymentStatus: "pending",
      assignedTo: assignedTeam,
      services: selectedServices.map(s => s.title),
    };

    dummyProjects.unshift(newProject);
    navigate(`/projects/${newProject.id}`);
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="pl-0">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
      </Button>
      <h1 className="text-2xl font-bold tracking-tight">
        Tell us about your project
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Project Name</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            id="projectName"
            placeholder="e.g., New Corporate Website"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Value</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">IDR</span>
              <CurrencyInput
                id="projectBudget"
                placeholder="50,000,000"
                value={budget}
                onChange={setBudget}
                className="pl-12"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Start Date</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Due Date</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Due</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !paymentDueDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDueDate ? format(paymentDueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={paymentDueDate} onSelect={setPaymentDueDate} initialFocus />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Description</CardTitle>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            value={projectDescription}
            onChange={setProjectDescription}
            placeholder="Describe your project goals, target audience, and key features..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Team</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamSelector selectedUsers={assignedTeam} onTeamChange={setAssignedTeam} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Selected Services</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {selectedServices.map((service) => (
            <div key={service.title} className="flex items-center gap-2 bg-muted py-1 px-2 rounded-md">
              <div className={cn("p-1 rounded-sm", service.iconColor)}>
                <service.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{service.title}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brief File</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              id="briefAttachment"
              type="file"
              className="sr-only"
              onChange={(e) => setBriefFile(e.target.files ? e.target.files[0] : null)}
            />
            <Label htmlFor="briefAttachment" className="w-full">
              <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent hover:text-accent-foreground">
                <span className={cn("truncate", !briefFile && "text-muted-foreground")}>
                  {briefFile ? briefFile.name : "Attach a file..."}
                </span>
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </div>
            </Label>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Attach any relevant documents for the project brief.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSubmitRequest} disabled={isSubmitDisabled}>Submit Request</Button>
      </div>

      <RequestComments />
    </div>
  );
};

export default ProjectDetailsForm;