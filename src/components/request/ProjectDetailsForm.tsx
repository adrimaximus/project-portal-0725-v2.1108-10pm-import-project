import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import ModernTeamSelector from "./ModernTeamSelector";
import FileUploader from "./FileUploader";
import { useNavigate } from "react-router-dom";
import { Service, services as allServicesData } from "@/data/services";
import { DateRange } from "react-day-picker";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";
import { toast } from "sonner";

interface ProjectDetailsFormProps {
  selectedServices: Service[];
  onBack: () => void;
}

const ProjectDetailsForm = ({ selectedServices, onBack }: ProjectDetailsFormProps) => {
  const { user: currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [projectName, setProjectName] = useState("");
  const [date, setDate] = useState<DateRange | undefined>();
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [team, setTeam] = useState<User[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select(`
        id,
        first_name,
        last_name,
        avatar_url,
        email
      `);

      if (error) {
        toast.error("Failed to fetch users.");
        console.error('Error fetching users:', error);
      } else {
        const users = data.map(profile => ({
          id: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'No name',
          avatar: profile.avatar_url,
          email: profile.email,
          initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'NN',
          first_name: profile.first_name,
          last_name: profile.last_name,
        }));
        setAllUsers(users);
      }
    };

    fetchUsers();
  }, []);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    if (rawValue) {
      const formattedValue = new Intl.NumberFormat('id-ID').format(parseInt(rawValue));
      setBudget(`Rp ${formattedValue}`);
    } else {
      setBudget('');
    }
  };

  const handleTeamChange = (userToToggle: User) => {
    setTeam((currentTeam) =>
      currentTeam.some((user) => user.id === userToToggle.id)
        ? currentTeam.filter((user) => user.id !== userToToggle.id)
        : [...currentTeam, userToToggle]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("You must be logged in to create a project.");
      return;
    }
    if (!projectName.trim()) {
      toast.error("Project name is required.");
      return;
    }

    setIsSubmitting(true);

    const numericBudget = parseInt(budget.replace(/[^0-9]/g, ''), 10) || 0;

    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: projectName,
        category: "Requested Event",
        description: description,
        status: "Requested",
        budget: numericBudget,
        start_date: date?.from?.toISOString(),
        due_date: date?.to?.toISOString(),
        created_by: currentUser.id,
      })
      .select('id, slug')
      .single();

    if (projectError) {
      toast.error("Failed to create project.");
      console.error('Error creating project:', projectError);
      setIsSubmitting(false);
      return;
    }

    const newProjectId = projectData.id;
    const newProjectSlug = projectData.slug;

    // Link services to the project
    if (selectedServices.length > 0) {
      const servicesToInsert = selectedServices.map(service => ({
        project_id: newProjectId,
        service_title: service.title,
      }));
      const { error: servicesError } = await supabase.from('project_services').insert(servicesToInsert);
      if (servicesError) {
        console.error('Failed to link services:', servicesError);
        toast.warning('Project created, but could not link services.');
      }
    }

    if (team.length > 0) {
      const membersToInsert = team.map(member => ({
        project_id: newProjectId,
        user_id: member.id,
        role: 'member' as const
      }));

      const { error: membersError } = await supabase
        .from('project_members')
        .insert(membersToInsert);

      if (membersError) {
        toast.error("Failed to add team members to the project.");
        console.error('Error adding project members:', membersError);
      }
    }

    if (files.length > 0) {
      toast.info(`Uploading ${files.length} file(s)...`);
      for (const file of files) {
        const filePath = `${newProjectId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('project-files').upload(filePath, file);
        
        if (uploadError) {
          toast.error(`Failed to upload ${file.name}.`);
          console.error('Error uploading file:', uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(filePath);
        
        await supabase.from('project_files').insert({
          project_id: newProjectId,
          user_id: currentUser.id,
          name: file.name,
          size: file.size,
          type: file.type,
          url: urlData.publicUrl,
          storage_path: filePath,
        });
      }
    }
    
    toast.success("Project created successfully!");
    setIsSubmitting(false);
    navigate(`/projects/${newProjectSlug}`);
  };

  const serviceDetails = selectedServices
    .map((service) => allServicesData.find((s) => s.title === service.title))
    .filter((s): s is Service => s !== undefined);

  const assignableUsers = allUsers.filter(user => user.id !== currentUser?.id);

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
            <ModernTeamSelector users={assignableUsers} selectedUsers={team} onSelectionChange={handleTeamChange} />
          </div>
          <div className="space-y-2">
            <Label>Attach Files</Label>
            <FileUploader onFilesChange={setFiles} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>Back</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Project Request"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default ProjectDetailsForm;