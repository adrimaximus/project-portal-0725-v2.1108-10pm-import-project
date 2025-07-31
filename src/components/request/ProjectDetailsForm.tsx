import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Service } from "@/data/services";
import { dummyProjects, Project, AssignedUser } from "@/data/projects";
import { ArrowLeft, Calendar as CalendarIcon, Paperclip, Wallet, CalendarDays, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays } from "date-fns";
import { CurrencyInput } from "@/components/ui/currency-input";
import RichTextEditor from "@/components/RichTextEditor";
import RequestComments from "@/components/request/RequestComments";
import TeamSelector from "./TeamSelector";
import { allUsers } from "@/data/users";
import FileIcon from "@/components/FileIcon";

interface ProjectDetailsFormProps {
  selectedServices: Service[];
  onBack: () => void;
}

const ProjectDetailsForm = ({ selectedServices, onBack }: ProjectDetailsFormProps) => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [date, setDate] = useState<DateRange | undefined>();
  const [paymentDueDate, setPaymentDueDate] = useState<Date>();
  const [budget, setBudget] = useState<number | undefined>();
  const [briefFiles, setBriefFiles] = useState<File[]>([]);
  const [assignedTeam, setAssignedTeam] = useState<AssignedUser[]>([]);

  const isSubmitDisabled = !projectName || !projectDescription || selectedServices.length === 0 || !date?.from || !date?.to || !budget || assignedTeam.length === 0;

  useEffect(() => {
    if (date?.to) {
      const newPaymentDueDate = addDays(date.to, 45);
      setPaymentDueDate(newPaymentDueDate);
    } else {
      setPaymentDueDate(undefined);
    }
  }, [date]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setBriefFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setBriefFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmitRequest = () => {
    if (isSubmitDisabled || !date?.from || !date?.to) {
      alert("Please fill all required fields.");
      return;
    }

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectName,
      description: projectDescription,
      status: "Requested",
      progress: 0,
      startDate: format(date.from, "yyyy-MM-dd"),
      endDate: format(date.to, "yyyy-MM-dd"),
      deadline: format(date.to, "yyyy-MM-dd"),
      paymentDueDate: paymentDueDate ? format(paymentDueDate, "yyyy-MM-dd") : undefined,
      budget: budget as number,
      paymentStatus: "proposed",
      createdBy: allUsers[0],
      assignedTo: assignedTeam,
      services: selectedServices.map(s => s.title),
      briefFiles: briefFiles,
      imageUrl: '/placeholder.svg',
      category: selectedServices.length > 0 ? selectedServices[0].title : 'General',
      rating: 0,
      tickets: 0,
      tasks: [],
      activityFeed: [],
    };

    dummyProjects.unshift(newProject);
    navigate(`/projects/${newProject.id}`);
  };

  return (
    // This container fills the parent <main> and breaks out of its padding
    <div className="flex h-full flex-col -mx-4 -my-2 lg:-mx-6 lg:-my-4">
      {/* This content area is scrollable and has the padding re-applied */}
      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-2 lg:px-6 lg:py-4">
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
              <CardTitle className="text-sm font-medium">Project Timeline</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
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
            </CardContent>
          </Card>
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
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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
              <CardTitle>Brief Files</CardTitle>
            </CardHeader>
            <CardContent>
              {briefFiles.length > 0 && (
                <div className="mb-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {briefFiles.map((file, index) => (
                    <div key={index} className="relative group border rounded-lg overflow-hidden aspect-square">
                      {file.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted flex flex-col items-center justify-center p-2">
                          <FileIcon fileType={file.type} className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-xs text-white truncate">{file.name}</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <Input
                id="briefAttachment"
                type="file"
                multiple
                className="sr-only"
                onChange={handleFileChange}
              />
              <Label htmlFor="briefAttachment" className="w-full cursor-pointer">
                <div className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg border-input bg-background hover:bg-accent">
                  <Paperclip className="w-8 h-8 mb-3 text-muted-foreground" />
                  <p className="mb-1 text-sm text-foreground font-semibold">Click to upload files</p>
                  <p className="text-xs text-muted-foreground">You can attach multiple documents</p>
                </div>
              </Label>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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
        </div>

        <RequestComments />
      </div>

      {/* This footer will stick to the bottom of the container */}
      <div className="flex justify-end border-t bg-background p-4">
        <Button onClick={handleSubmitRequest} disabled={isSubmitDisabled}>Submit Request</Button>
      </div>
    </div>
  );
};

export default ProjectDetailsForm;