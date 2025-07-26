import React from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Service } from "@/data/services";
import { AssignedUser } from "@/data/projects";
import { ArrowLeft, Calendar as CalendarIcon, Paperclip, Wallet, CalendarDays, CalendarClock, FileText, X } from "lucide-react";
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
  projectName: string;
  setProjectName: (value: string) => void;
  projectDescription: string;
  setProjectDescription: (value: string) => void;
  startDate?: Date;
  setStartDate: (date?: Date) => void;
  endDate?: Date;
  setEndDate: (date?: Date) => void;
  paymentDueDate?: Date;
  setPaymentDueDate: (date?: Date) => void;
  budget?: number;
  setBudget: (value?: number) => void;
  briefFiles: File[];
  setBriefFiles: (files: File[]) => void;
  assignedTeam: AssignedUser[];
  setAssignedTeam: (team: AssignedUser[]) => void;
}

const ProjectDetailsForm = ({
  selectedServices,
  onBack,
  projectName,
  setProjectName,
  projectDescription,
  setProjectDescription,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  paymentDueDate,
  setPaymentDueDate,
  budget,
  setBudget,
  briefFiles,
  setBriefFiles,
  assignedTeam,
  setAssignedTeam,
}: ProjectDetailsFormProps) => {

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setBriefFiles([...briefFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setBriefFiles(briefFiles.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 p-4 lg:p-6 pb-24">
        <div>
          <Button variant="ghost" onClick={onBack} className="-ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
          </Button>
          <h1 className="text-2xl font-bold tracking-tight mt-2">
            Tell us about your project
          </h1>
        </div>

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
            <CardTitle>Brief Files</CardTitle>
          </CardHeader>
          <CardContent>
            {briefFiles.length > 0 && (
              <div className="mb-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
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
                        <FileText className="h-8 w-8 text-muted-foreground" />
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

        <RequestComments />
      </div>
    </div>
  );
};

export default ProjectDetailsForm;