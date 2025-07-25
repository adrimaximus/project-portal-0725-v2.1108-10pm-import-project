import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, Calendar as CalendarIcon, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CurrencyInput } from "@/components/ui/currency-input";

type Service = {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
};

type ProjectData = {
  projectName: string;
  projectDescription: string;
  budget?: number;
  startDate?: Date;
  endDate?: Date;
  briefFile?: File | null;
  selectedServices: Service[];
};

type ProjectRequestFormProps = {
  initialData?: Partial<ProjectData>;
  onSubmit: (data: Omit<ProjectData, 'selectedServices'>) => void;
  isDialog?: boolean;
  children?: React.ReactNode;
};

const ProjectRequestForm = ({ initialData = {}, onSubmit, isDialog = false, children }: ProjectRequestFormProps) => {
  const [projectName, setProjectName] = useState(initialData.projectName || "");
  const [projectDescription, setProjectDescription] = useState(initialData.projectDescription || "");
  const [budget, setBudget] = useState(initialData.budget);
  const [startDate, setStartDate] = useState(initialData.startDate);
  const [endDate, setEndDate] = useState(initialData.endDate);
  const [briefFile, setBriefFile] = useState<File | null>(initialData.briefFile || null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      projectName,
      projectDescription,
      budget,
      startDate,
      endDate,
      briefFile,
    });
  };

  const FormContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="projectName">Project Name</Label>
        <Input id="projectName" placeholder="e.g., New Corporate Website" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="projectDescription">Project Description</Label>
        <Textarea id="projectDescription" placeholder="Describe your project goals, target audience, and key features..." rows={5} value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="projectBudget">Budget</Label>
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">IDR</span>
          <CurrencyInput id="projectBudget" placeholder="50,000,000" value={budget} onChange={setBudget} className="pl-12" />
        </div>
        <p className="text-sm text-muted-foreground">Enter your estimated project budget in Indonesian Rupiah.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Due Date Project</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus /></PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="briefAttachment">Brief File</Label>
        <div className="relative">
          <Input id="briefAttachment" type="file" className="sr-only" onChange={(e) => setBriefFile(e.target.files ? e.target.files[0] : null)} />
          <Label htmlFor="briefAttachment" className="w-full">
            <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer hover:bg-accent hover:text-accent-foreground">
              <span className={cn("truncate", !briefFile && "text-muted-foreground")}>{briefFile ? briefFile.name : "Attach a file..."}</span>
              <Paperclip className="h-4 w-4 text-muted-foreground" />
            </div>
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">Attach any relevant documents for the project brief.</p>
      </div>
      {children}
    </form>
  );

  if (isDialog) {
    return FormContent;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
      </CardHeader>
      <CardContent>
        {FormContent}
      </CardContent>
    </Card>
  );
};

export default ProjectRequestForm;