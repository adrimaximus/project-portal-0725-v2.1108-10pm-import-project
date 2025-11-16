import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import ModernTeamSelector from "./ModernTeamSelector";
import FileUploader from "./FileUploader";
import { useNavigate } from "react-router-dom";
import { DateRange } from "react-day-picker";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { User, Person, Company, Service } from "@/types";
import { toast } from "sonner";
import { useCreateProject } from "@/hooks/useCreateProject";
import { getInitials } from "@/lib/utils";
import AddressAutocompleteInput from "../AddressAutocompleteInput";
import { ClientSelector } from "./ClientSelector";
import PersonFormDialog from "../people/PersonFormDialog";
import Icon from "@/components/Icon";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface ProjectDetailsFormProps {
  selectedServices: Service[];
  onBack: () => void;
}

const ProjectDetailsForm = ({ selectedServices, onBack }: ProjectDetailsFormProps) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const createProjectMutation = useCreateProject();
  const queryClient = useQueryClient();

  const [projectName, setProjectName] = useState("");
  const [date, setDate] = useState<DateRange | undefined>();
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [team, setTeam] = useState<User[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [venue, setVenue] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<{ type: 'person' | 'company', data: Person | Company } | null>(null);
  const [isPersonFormOpen, setIsPersonFormOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ['allUsersForRequestForm'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, first_name, last_name, avatar_url, email');
      if (error) {
        toast.error("Failed to fetch users.");
        throw error;
      }
      return data.map(profile => {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        return {
          id: profile.id,
          name: fullName || profile.email || 'No name',
          avatar_url: profile.avatar_url,
          email: profile.email,
          initials: getInitials(fullName, profile.email) || 'NN',
          first_name: profile.first_name,
          last_name: profile.last_name,
        };
      });
    }
  });

  const { data: allPeople = [] } = useQuery<Person[]>({
    queryKey: ['allPeopleForRequestForm'],
    queryFn: async () => {
      const { data, error } = await supabase.from('people').select('*');
      if (error) {
        toast.error("Failed to fetch clients.");
        throw error;
      }
      return data;
    }
  });

  const { data: allCompanies = [] } = useQuery<Company[]>({
    queryKey: ['allCompaniesForRequestForm'],
    queryFn: async () => {
      const { data, error } = await supabase.from('companies').select('*').order('name', { ascending: true });
      if (error) {
        toast.error("Failed to fetch companies.");
        throw error;
      }
      return data;
    }
  });

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

  const handlePersonCreated = (newPerson: Person) => {
    queryClient.invalidateQueries({ queryKey: ['allPeopleForRequestForm'] }).then(() => {
      setSelectedClient({ type: 'person', data: newPerson });
    });
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

    const numericBudget = parseInt(budget.replace(/[^0-9]/g, ''), 10) || 0;
    const clientCompanyId = selectedClient?.type === 'company' ? selectedClient.data.id : null;

    createProjectMutation.mutate({
      name: projectName,
      description: description,
      category: "Requested Event",
      budget: numericBudget,
      startDate: date?.from?.toISOString(),
      dueDate: date?.to?.toISOString(),
      venue: venue,
      client_company_id: clientCompanyId,
    }, {
      onSuccess: async (newProject) => {
        const newProjectId = newProject.id;
        const newProjectSlug = newProject.slug;

        if (selectedClient?.type === 'person') {
          const { error: clientLinkError } = await supabase.from('people_projects').insert({
            person_id: selectedClient.data.id,
            project_id: newProjectId,
          });
          if (clientLinkError) {
            toast.error("Failed to link client to the project.");
            console.error('Error linking client:', clientLinkError);
          }
        }

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
          const { error: membersError } = await supabase.from('project_members').insert(membersToInsert);
          if (membersError) {
            toast.error("Failed to add team members to the project.");
            console.error('Error adding project members:', membersError);
          }
        }

        if (files.length > 0) {
          toast.info(`Uploading ${files.length} file(s)...`);
          for (const file of files) {
            const sanitizedFileName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
            const filePath = `${newProjectId}/${Date.now()}-${sanitizedFileName}`;
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
        
        navigate(`/projects/${newProjectSlug}`);
      }
    });
  };

  const assignableUsers = allUsers.filter(user => user.id !== currentUser?.id);

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
            <CardDescription>Fill out the form below to create a new project.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 max-h-[60vh] overflow-y-auto p-6">
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
              <Label>Client</Label>
              <ClientSelector
                people={allPeople}
                companies={allCompanies}
                selectedClient={selectedClient}
                onSelectClient={setSelectedClient}
                onAddNewClient={(name) => {
                  setNewClientName(name);
                  setIsPersonFormOpen(true);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Selected Services</Label>
              <div className="flex flex-wrap gap-2 rounded-md border p-3 bg-muted/50 min-h-[40px]">
                {selectedServices.length > 0 ? selectedServices.map((service) => (
                  <Badge key={service.title} variant="secondary" className="flex items-center gap-2">
                    <Icon name={service.icon as any} className={cn("h-4 w-4", service.icon_color)} />
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
              <Label htmlFor="venue">Venue</Label>
              <AddressAutocompleteInput
                value={venue}
                onChange={setVenue}
              />
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
            <Button type="button" variant="outline" onClick={onBack} disabled={createProjectMutation.isPending}>Back</Button>
            <Button type="submit" disabled={createProjectMutation.isPending}>
              {createProjectMutation.isPending ? "Creating..." : "Create Project"}
            </Button>
          </CardFooter>
        </Card>
      </form>
      <PersonFormDialog
        open={isPersonFormOpen}
        onOpenChange={setIsPersonFormOpen}
        onSuccess={handlePersonCreated}
        person={null}
        initialValues={{ full_name: newClientName }}
      />
    </>
  );
};

export default ProjectDetailsForm;