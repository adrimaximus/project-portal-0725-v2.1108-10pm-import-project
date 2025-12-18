import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project as BaseProject, PROJECT_STATUS_OPTIONS, Person, Company, ProjectStatus } from "@/types";
import { Calendar, Wallet, Briefcase, MapPin, ListTodo, CreditCard, User, Building, ChevronsUpDown, Plus } from "lucide-react";
import { isSameDay, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { CurrencyInput } from "../ui/currency-input";
import ProjectServices from "./ProjectServices";
import { formatInJakarta, cn, getTextColor } from "@/lib/utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import StatusBadge from "../StatusBadge";
import { Badge } from "@/components/ui/badge";
import AddressAutocompleteInput from '../AddressAutocompleteInput';
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { useProjectStatuses } from "@/hooks/useProjectStatuses";
import { usePaymentStatuses } from "@/hooks/usePaymentStatuses";
import { DatePickerWithRange } from "@/components/ui/date-picker-with-range";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Extend types to include the new optional company_id field for a robust relationship.
type LocalPerson = Person & { company_id?: string | null };
type Project = BaseProject & {
  people?: LocalPerson[];
  person_ids?: string[];
  client_company_id?: string | null;
};

interface ProjectDetailsCardProps {
  project: Project;
  isEditing: boolean;
  onFieldChange: (field: keyof Project, value: any) => void;
  onStatusChange?: (newStatus: ProjectStatus) => void;
  hasOpenTasks: boolean;
}

const ProjectDetailsCard = ({ project, isEditing, onFieldChange, onStatusChange, hasOpenTasks }: ProjectDetailsCardProps) => {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canViewValue = hasPermission('projects:view_value');
  const { data: projectStatuses = [] } = useProjectStatuses();
  const { data: paymentStatuses = [], isLoading: isLoadingPaymentStatuses } = usePaymentStatuses();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newClientType, setNewClientType] = useState<'person' | 'company'>('person');
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  const clientInfo = useMemo(() => {
    return {
      name: project.client_name,
      companyName: project.client_company_name,
      avatarUrl: project.client_avatar_url,
      logoUrl: project.client_company_logo_url,
    };
  }, [project]);

  // Remove 'enabled: isEditing' to allow data fetching for quick-edit dropdown
  const { data: allPeople, isLoading: isLoadingPeople } = useQuery<LocalPerson[]>({
    queryKey: ['allPeople'],
    queryFn: async () => {
        const { data, error } = await supabase.from('people').select('*').order('full_name', { ascending: true });
        if (error) throw error;
        return data;
    },
  });

  const { data: allCompanies, isLoading: isLoadingCompanies } = useQuery<Company[]>({
    queryKey: ['allCompanies'],
    queryFn: async () => {
        const { data, error } = await supabase.from('companies').select('*').order('name', { ascending: true });
        if (error) throw error;
        return data;
    },
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('projects')
        .update({ payment_status: newStatus })
        .eq('id', project.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment status updated");
      queryClient.invalidateQueries({ queryKey: ['project', project.slug] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast.error(`Error updating payment status: ${error.message}`);
    }
  });

  const updateClientMutation = useMutation({
    mutationFn: async (value: string) => {
      if (value.startsWith('company-')) {
        const companyId = value.replace('company-', '');
        // Update project to set client_company_id and clear people links
        const { error: projError } = await supabase
          .from('projects')
          .update({ client_company_id: companyId })
          .eq('id', project.id);
        if (projError) throw projError;

        const { error: peopleError } = await supabase
          .from('people_projects')
          .delete()
          .eq('project_id', project.id);
        if (peopleError) throw peopleError;
      } else {
        const personId = value;
        // Update project to clear client_company_id
        const { error: projError } = await supabase
          .from('projects')
          .update({ client_company_id: null })
          .eq('id', project.id);
        if (projError) throw projError;

        // Update people_projects: delete old, insert new
        const { error: delError } = await supabase
          .from('people_projects')
          .delete()
          .eq('project_id', project.id);
        if (delError) throw delError;
        
        const { error: insError } = await supabase
          .from('people_projects')
          .insert({ project_id: project.id, person_id: personId });
        if (insError) throw insError;
      }
    },
    onSuccess: () => {
      toast.success("Client updated");
      queryClient.invalidateQueries({ queryKey: ['project', project.slug] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      toast.error(`Error updating client: ${error.message}`);
    }
  });

  const createClientMutation = useMutation({
    mutationFn: async () => {
      if (newClientType === 'person') {
        const { data, error } = await supabase
          .from('people')
          .insert({
            full_name: newClientName,
            email: newClientEmail || null,
            contact: newClientEmail ? { emails: [newClientEmail] } : {}
          })
          .select()
          .single();
        if (error) throw error;
        return { type: 'person', data };
      } else {
        const { data, error } = await supabase
          .from('companies')
          .insert({
            name: newClientName
          })
          .select()
          .single();
        if (error) throw error;
        return { type: 'company', data };
      }
    },
    onSuccess: async (result) => {
      toast.success(`${newClientType === 'person' ? 'Person' : 'Company'} created`);
      setIsCreateDialogOpen(false);
      setNewClientName('');
      setNewClientEmail('');
      
      // Refresh lists
      await queryClient.invalidateQueries({ queryKey: ['allPeople'] });
      await queryClient.invalidateQueries({ queryKey: ['allCompanies'] });

      // If we are editing, update the field
      if (isEditing) {
        if (result.type === 'person') {
          // We need to fetch the full object from the cache or use the returned data
          // For simplicity in edit mode, we mimic what handleClientChange does
          const personId = result.data.id;
          const selectedPerson = { ...result.data, company_id: null } as LocalPerson; // Minimal required
          onFieldChange('person_ids', [personId]);
          onFieldChange('people', [selectedPerson]);
          onFieldChange('client_company_id', null);
        } else {
          onFieldChange('person_ids', []);
          onFieldChange('people', []);
          onFieldChange('client_company_id', result.data.id);
        }
      } else {
        // If not in editing mode (direct update via dropdown)
        if (result.type === 'person') {
          updateClientMutation.mutate(result.data.id);
        } else {
          updateClientMutation.mutate(`company-${result.data.id}`);
        }
      }
    },
    onError: (error) => {
      toast.error(`Error creating client: ${error.message}`);
    }
  });

  const handleDateChange = (range: DateRange | undefined) => {
    const startDate = range?.from ? range.from.toISOString() : undefined;
    const endDateValue = range?.to || range?.from;
    const endDate = endDateValue ? endDateValue.toISOString() : undefined;

    onFieldChange('start_date', startDate);
    onFieldChange('due_date', endDate);
  };

  const handleBudgetChange = (value: number | null) => {
    onFieldChange('budget', value || 0);
  };

  const handleClientChange = async (value: string) => {
    if (value === 'create-new') {
      setIsCreateDialogOpen(true);
      return;
    }

    if (value.startsWith('company-')) {
      const companyId = value.replace('company-', '');
      onFieldChange('person_ids', []);
      onFieldChange('people', []);
      onFieldChange('client_company_id', companyId);
    } else {
      const personId = value;
      const selectedPerson = allPeople?.find(p => p.id === personId);
      if (selectedPerson) {
        onFieldChange('person_ids', [personId]);
        onFieldChange('people', [selectedPerson]);
        onFieldChange('client_company_id', null);
      }
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

  const renderDateRange = () => {
    if (!project.start_date) return 'N/A';
    const start = new Date(project.start_date);
    const end = project.due_date ? new Date(project.due_date) : start;

    const isExclusiveEndDate =
      project.due_date &&
      end.getUTCHours() === 0 &&
      end.getUTCMinutes() === 0 &&
      end.getUTCSeconds() === 0 &&
      end.getUTCMilliseconds() === 0 &&
      !isSameDay(start, end);

    const adjustedEnd = isExclusiveEndDate ? subDays(end, 1) : end;

    if (isSameDay(start, adjustedEnd)) {
        return formatInJakarta(project.start_date, "dd MMM yyyy");
    }
    return `${formatInJakarta(project.start_date, "dd MMM yyyy")} - ${formatInJakarta(adjustedEnd, "dd MMM yyyy")}`;
  };

  const renderVenue = () => {
    if (!project.venue) {
      return <p className="text-muted-foreground">No venue specified</p>;
    }

    let fullQuery = project.venue;
    let displayVenue = project.venue;

    try {
      const parsed = JSON.parse(project.venue);
      if (parsed.name && parsed.address) {
        displayVenue = `${parsed.name} - ${parsed.address}`;
        fullQuery = `${parsed.name}, ${parsed.address}`;
      }
    } catch (e) {
      // Not a JSON string, use as is
    }

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullQuery)}`;

    return (
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline group"
      >
        <p className="text-muted-foreground group-hover:text-primary">{displayVenue}</p>
      </a>
    );
  };

  const currentPaymentStatus = paymentStatuses.find(s => s.name === project.payment_status);
  const paymentBgColor = currentPaymentStatus?.color || '#94a3b8';
  const paymentTextColor = getTextColor(paymentBgColor);
  const selectedValue = project.person_ids?.[0] || (project.client_company_id ? `company-${project.client_company_id}` : '');

  const renderClientSelectContent = () => (
    <SelectContent className="max-h-72">
      <SelectGroup>
        <SelectItem value="create-new" className="cursor-pointer font-medium text-primary focus:text-primary focus:bg-primary/10">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Client
          </div>
        </SelectItem>
      </SelectGroup>
      <SelectSeparator />
      {isLoadingPeople || isLoadingCompanies ? (
        <SelectItem value="loading" disabled>Loading...</SelectItem>
      ) : (
        <>
          {allCompanies && allCompanies.length > 0 && (
            <SelectGroup>
              <SelectLabel>Companies</SelectLabel>
              {allCompanies.map(company => (
                <SelectItem key={`company-${company.id}`} value={`company-${company.id}`}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
          {allPeople && allPeople.length > 0 && (
            <SelectGroup>
              <SelectLabel>People</SelectLabel>
              {allPeople.map(person => (
                <SelectItem key={person.id} value={person.id}>
                  {person.full_name} {person.company && `(${person.company})`}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </>
      )}
    </SelectContent>
  );

  const handleDropdownChange = (value: string) => {
    if (value === 'create-new') {
        setIsCreateDialogOpen(true);
        // Reset form
        setNewClientName('');
        setNewClientEmail('');
        return;
    }
    updateClientMutation.mutate(value);
  }

  return (
    <Card>
      <Collapsible defaultOpen>
        <div className="flex items-center justify-between">
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-4">
              <ChevronsUpDown className="h-4 w-4" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm pt-0">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Calendar className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                <div className="w-full">
                  <p className="font-medium">Timeline</p>
                  {isEditing ? (
                    <DatePickerWithRange
                      date={{
                        from: project.start_date ? new Date(project.start_date) : undefined,
                        to: project.due_date ? new Date(project.due_date) : undefined,
                      }}
                      onDateChange={handleDateChange}
                      className="w-full"
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {renderDateRange()}
                    </p>
                  )}
                </div>
              </div>
              {hasPermission('project:budget:read') && (
                <div className="flex items-start gap-4">
                  <Wallet className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Budget</p>
                    {isEditing ? (
                      <CurrencyInput
                        value={project.budget || 0}
                        onChange={handleBudgetChange}
                        placeholder="Enter budget"
                        className="w-full"
                      />
                    ) : (
                      <p className="text-muted-foreground">
                        {formatCurrency(project.budget || 0)}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-start gap-4">
                <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                <div className="w-full">
                  <p className="font-medium">Venue</p>
                  {isEditing ? (
                    <AddressAutocompleteInput
                      value={project.venue || ''}
                      onChange={(value) => onFieldChange('venue', value)}
                    />
                  ) : (
                    renderVenue()
                  )}
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Briefcase className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                <div className="w-full">
                  <p className="font-medium">Services</p>
                  <div className="mt-1">
                    <ProjectServices
                      selectedServices={project.services || []}
                      isEditing={isEditing}
                      onServicesChange={(services) => onFieldChange('services', services)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <ListTodo className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                <div className="w-full">
                  <p className="font-medium">Status</p>
                  {isEditing ? (
                    <Select
                      value={project.status}
                      onValueChange={(value) => onFieldChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectStatuses.length > 0 ? (
                          projectStatuses.map(status => (
                            <SelectItem 
                              key={status.id} 
                              value={status.name}
                              disabled={status.name === 'Completed' && hasOpenTasks}
                            >
                              <div className="flex items-center">
                                <StatusBadge status={status.name} className="border-0 px-0 bg-transparent text-foreground hover:bg-transparent" />
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          PROJECT_STATUS_OPTIONS.map(option => (
                            <SelectItem 
                              key={option.value} 
                              value={option.value}
                              disabled={option.value === 'Completed' && hasOpenTasks}
                            >
                              {option.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="pt-1">
                      <StatusBadge status={project.status} onStatusChange={onStatusChange} hasOpenTasks={hasOpenTasks} />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CreditCard className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                <div className="w-full">
                  <p className="font-medium">Payment Status</p>
                  {isEditing ? (
                    <Select
                      value={project.payment_status}
                      onValueChange={(value) => onFieldChange('payment_status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a payment status" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingPaymentStatuses ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          paymentStatuses.map(option => (
                            <SelectItem key={option.id} value={option.name}>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: option.color }} />
                                {option.name}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="pt-1">
                      <Select
                        value={project.payment_status}
                        onValueChange={(value) => updatePaymentStatusMutation.mutate(value)}
                        disabled={updatePaymentStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-full h-auto p-0 border-none bg-transparent focus:ring-0 shadow-none hover:bg-accent/50 rounded-md transition-colors text-left flex items-center justify-between group">
                          <Badge 
                            variant="outline" 
                            className={cn("font-normal border-transparent cursor-pointer hover:opacity-80 transition-opacity")}
                            style={{ backgroundColor: paymentBgColor, color: paymentTextColor }}
                          >
                            {project.payment_status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingPaymentStatuses ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                          ) : (
                            paymentStatuses.map(option => (
                              <SelectItem key={option.id} value={option.name}>
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: option.color }} />
                                  {option.name}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Calendar className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">Payment Due Date</p>
                  <p className="text-muted-foreground">
                    {project.payment_due_date ? formatInJakarta(project.payment_due_date, "dd MMM yyyy") : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <User className="h-4 w-4 mt-1 flex-shrink-0 text-muted-foreground" />
                <div className="w-full">
                  <p className="font-medium">Client</p>
                  {isEditing ? (
                    <Select
                      value={selectedValue}
                      onValueChange={handleClientChange}
                      disabled={isLoadingPeople || isLoadingCompanies}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client or company..." />
                      </SelectTrigger>
                      {renderClientSelectContent()}
                    </Select>
                  ) : (
                    <div className="pt-1">
                      <Select
                        value={selectedValue}
                        onValueChange={handleDropdownChange}
                        disabled={updateClientMutation.isPending || isLoadingPeople || isLoadingCompanies}
                      >
                        <SelectTrigger className="w-full h-auto p-0 border-none bg-transparent focus:ring-0 shadow-none hover:bg-accent/50 rounded-md transition-colors text-left flex items-center justify-between group">
                          {clientInfo.name ? (
                            <div className="flex items-center gap-3 py-1 px-1">
                              {clientInfo.logoUrl ? (
                                <img src={clientInfo.logoUrl} alt={clientInfo.companyName || ''} className="h-8 w-8 object-contain rounded-md bg-muted p-1" />
                              ) : clientInfo.avatarUrl ? (
                                 <Avatar className="h-8 w-8">
                                    <AvatarImage src={clientInfo.avatarUrl} />
                                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                 </Avatar>
                              ) : (
                                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                                  <Building className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="text-foreground font-semibold text-sm">{clientInfo.name}</p>
                                {clientInfo.companyName && clientInfo.companyName !== clientInfo.name && (
                                  <p className="text-muted-foreground text-xs">{clientInfo.companyName}</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-muted-foreground py-1 px-1">No client assigned</p>
                          )}
                        </SelectTrigger>
                        {renderClientSelectContent()}
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Client</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="person" onValueChange={(v) => setNewClientType(v as 'person' | 'company')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="person">Person</TabsTrigger>
              <TabsTrigger value="company">Company</TabsTrigger>
            </TabsList>
            <TabsContent value="person" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="e.g. John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input id="email" type="email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} placeholder="john@example.com" />
              </div>
            </TabsContent>
            <TabsContent value="company" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="e.g. Acme Corp" />
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => createClientMutation.mutate()} disabled={!newClientName || createClientMutation.isPending}>
              {createClientMutation.isPending ? 'Creating...' : 'Create & Select'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProjectDetailsCard;