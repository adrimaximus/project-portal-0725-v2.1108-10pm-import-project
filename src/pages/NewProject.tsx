import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, Service } from "@/types";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateRangePicker } from "@/components/DateRangePicker";
import ModernTeamSelector from "@/components/request/ModernTeamSelector";
import ServiceSelector from "@/components/ServiceSelector";
import { Loader2 } from "lucide-react";

const NewProject = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [projectValue, setProjectValue] = useState<number | string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedTeam, setSelectedTeam] = useState<UserProfile[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);

  // Data from DB
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase.from('profiles').select('*');
      if (usersError) {
        toast.error("Failed to fetch users.");
      } else {
        const formattedUsers = usersData.map(p => ({
          id: p.id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email,
          email: p.email || '',
          avatar_url: p.avatar_url,
          initials: `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase(),
          first_name: p.first_name,
          last_name: p.last_name,
        }));
        setAllUsers(formattedUsers);
      }

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase.from('services').select('*');
      if (servicesError) {
        toast.error("Failed to fetch services.");
      } else {
        setAllServices(servicesData);
      }
    };
    fetchData();
  }, []);

  const handleTeamSelection = (member: UserProfile) => {
    setSelectedTeam((prev) =>
      prev.some((u) => u.id === member.id)
        ? prev.filter((u) => u.id !== member.id)
        : [...prev, member]
    );
  };

  const handleServiceSelection = (service: Service) => {
    setSelectedServices((prev) =>
      prev.some((s) => s.title === service.title)
        ? prev.filter((s) => s.title !== service.title)
        : [...prev, service]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to create a project.");
      return;
    }
    if (!projectName) {
      toast.error("Project name is required.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Creating your project...");

    try {
      // 1. Insert into projects table
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: projectName,
          description: description,
          budget: projectValue ? Number(projectValue) : null,
          start_date: dateRange?.from?.toISOString(),
          due_date: dateRange?.to?.toISOString(),
          created_by: user.id,
          status: 'Requested',
          payment_status: 'Proposed',
        })
        .select()
        .single();

      if (projectError) throw projectError;

      const newProjectId = projectData.id;

      // 2. Insert team members
      if (selectedTeam.length > 0) {
        const membersToInsert = selectedTeam.map((member) => ({
          project_id: newProjectId,
          user_id: member.id,
          role: 'member',
        }));
        const { error: membersError } = await supabase
          .from("project_members")
          .insert(membersToInsert);
        if (membersError) throw membersError;
      }

      // 3. Insert services
      if (selectedServices.length > 0) {
        const servicesToInsert = selectedServices.map((service) => ({
          project_id: newProjectId,
          service_title: service.title,
        }));
        const { error: servicesError } = await supabase
          .from("project_services")
          .insert(servicesToInsert);
        if (servicesError) throw servicesError;
      }

      // 4. Handle attachment
      if (attachment) {
        const filePath = `${newProjectId}/${Date.now()}-${attachment.name}`;
        const { error: uploadError } = await supabase.storage
          .from("project-files")
          .upload(filePath, attachment);
        
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("project-files")
          .getPublicUrl(filePath);

        const { error: fileDbError } = await supabase
          .from("project_files")
          .insert({
            project_id: newProjectId,
            user_id: user.id,
            name: attachment.name,
            size: attachment.size,
            type: attachment.type,
            url: urlData.publicUrl,
            storage_path: filePath,
          });
        if (fileDbError) throw fileDbError;
      }

      toast.success("Project created successfully!", { id: toastId });
      navigate(`/projects/${newProjectId}`);
    } catch (error: any) {
      console.error("Failed to create project:", error);
      toast.error(`Failed to create project: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PortalLayout pageHeader={<div className="p-4 md:p-6 border-b bg-background"><h1 className="text-2xl font-bold">Create New Project</h1></div>}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., New Website Design"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a brief description of the project..."
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
              </CardHeader>
              <CardContent>
                <ServiceSelector
                  services={allServices}
                  selectedServices={selectedServices}
                  onSelectionChange={handleServiceSelection}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Timeline</Label>
                  <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-value">Project Value ($)</Label>
                  <Input
                    id="project-value"
                    type="number"
                    value={projectValue}
                    onChange={(e) => setProjectValue(e.target.value)}
                    placeholder="e.g., 5000"
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Assign Team</CardTitle>
              </CardHeader>
              <CardContent>
                <ModernTeamSelector
                  users={allUsers}
                  selectedUsers={selectedTeam}
                  onSelectionChange={handleTeamSelection}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Attachment</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="file"
                  onChange={(e) => setAttachment(e.target.files ? e.target.files[0] : null)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Project
          </Button>
        </div>
      </form>
    </PortalLayout>
  );
};

export default NewProject;