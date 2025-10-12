import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project as BaseProject, PROJECT_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS, Person } from "@/types";
import { Calendar, Wallet, Briefcase, MapPin, ListTodo, CreditCard, User, Building, ChevronsUpDown } from "lucide-react";
import { isSameDay, subDays } from "date-fns";
import { DateRangePicker } from "../DateRangePicker";
import { DateRange } from "react-day-picker";
import { CurrencyInput } from "../ui/currency-input";
import ProjectServices from "./ProjectServices";
import { formatInJakarta, cn, getPaymentStatusStyles } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "../StatusBadge";
import { Badge } from "@/components/ui/badge";
import AddressAutocompleteInput from '../AddressAutocompleteInput';
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

// Extend types to include the new optional company_id field for a robust relationship.
type LocalPerson = Person & { company_id?: string | null };
type Project = BaseProject & {
  people?: LocalPerson[];
  person_ids?: string[];
};

interface ProjectDetailsCardProps {
  project: Project;
  isEditing: boolean;
  onFieldChange: (field: keyof Project, value: any) => void;
}

const ProjectDetailsCard = ({ project, isEditing, onFieldChange }: ProjectDetailsCardProps) => {
  const { hasPermission } = useAuth();
  const canViewValue = hasPermission('projects:view_value');

  const client = project.people?.[0];

  const { data: companyProperties = [] } = useQuery({
    queryKey: ['company_properties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('company_properties').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: company } = useQuery({
    queryKey: ['company_logo', client?.id],
    queryFn: async () => {
      if (!client) return null;

      // 1. Prioritize fetching by company_id for a reliable link
      if (client.company_id) {
        const { data, error } = await supabase
          .from('companies')
          .select('logo_url, custom_properties')
          .eq('id', client.company_id)
          .single();
        if (!error && data) {
          return data;
        }
        if (error) {
           console.warn(`Could not fetch company by ID "${client.company_id}":`, error.message);
        }
      }

      // 2. Fallback to fetching by company name (case-insensitive)
      if (client.company) {
        const { data, error } = await supabase
          .from('companies')
          .select('logo_url, custom_properties')
          .ilike('name', client.company)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116: "single row not found"
          console.warn(`Could not fetch logo for company name "${client.company}":`, error.message);
        }
        return data;
      }
      
      return null;
    },
    enabled: !!client,
  });

  const companyLogoUrl = useMemo(() => {
    if (!company) return null;
    const logoProperty = companyProperties.find(p => p.label === 'Logo Image');
    if (logoProperty && company.custom_properties) {
        const customLogo = company.custom_properties[logoProperty.name];
        if (customLogo) return customLogo;
    }
    return company.logo_url;
  }, [company, companyProperties]);

  const { data: allPeople, isLoading: isLoadingPeople } = useQuery<LocalPerson[]>({
    queryKey: ['allPeople'],
    queryFn: async () => {
        const { data, error } = await supabase.from('people').select('*');
        if (error) throw error;
        return data;
    },
    enabled: isEditing,
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

  const handleClientChange = (personId: string) => {
    const selectedPerson = allPeople?.find(p => p.id === personId);
    if (selectedPerson) {
        onFieldChange('people', [selectedPerson]);
        onFieldChange('person_ids', [personId]);
    } else {
        onFieldChange('people', []);
        onFieldChange('person_ids', []);
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

    let venueName = '';
    let venueAddress = '';
    let fullQuery = project.venue;
    let displayVenue = project.venue;

    try {
      const parsed = JSON.parse(project.venue);
      venueName = parsed.name || '';
      venueAddress = parsed.address || '';
      const parts = [venueName, venueAddress].filter(Boolean);
      if (parts.length > 0) {
        displayVenue = parts.join(' - ');
        fullQuery = `${venueName}, ${venueAddress}`;
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
        {venueName && venueAddress ? (
          <div>
            <p className="font-semibold text-foreground group-hover:text-primary">{venueName}</p>
            <p className="text-muted-foreground">{venueAddress}</p>
          </div>
        ) : (
          <p className="text-muted-foreground group-hover:text-primary">{displayVenue}</p>
        )}
      </a>
    );
  };

  const paymentBadgeColor = getPaymentStatusStyles(project.payment_status).tw;
  const hasOpenTasks = project.tasks?.some(task => !task.completed);

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
                    <DateRangePicker
                      date={{
                        from: project.start_date ? new Date(project.start_date) : undefined,
                        to: project.due_date ? new Date(project.due_date) : undefined,
                      }}
                      onDateChange={handleDateChange}
                    />
                  ) : (
                    <p className="text-muted-foreground">
                      {renderDateRange()}
                    </p>
                  )}
                </div>
              </div>
              {canViewValue && (
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
                        {PROJECT_STATUS_OPTIONS.map(option => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value}
                            disabled={option.value === 'Completed' && hasOpenTasks}
                          >
                            <StatusBadge status={option.label} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="pt-1">
                      <StatusBadge status={project.status} />
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
                        {PAYMENT_STATUS_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <Badge variant="outline" className={cn("border-transparent font-normal", getPaymentStatusStyles(option.value).tw)}>
                              {option.label}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="pt-1">
                      <Badge variant="outline" className={cn("font-normal", paymentBadgeColor)}>
                        {project.payment_status}
                      </Badge>
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
                      value={client?.id}
                      onValueChange={handleClientChange}
                      disabled={isLoadingPeople}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingPeople ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          allPeople?.map(person => (
                            <SelectItem key={person.id} value={person.id}>
                              {person.full_name} {person.company && `(${person.company})`}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="pt-1">
                      {client ? (
                        <div className="flex items-center gap-3">
                          {companyLogoUrl ? (
                            <img src={companyLogoUrl} alt={client.company || ''} className="h-8 w-8 object-contain rounded-md bg-muted p-1" />
                          ) : (
                            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                              <Building className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="text-foreground font-semibold">{client.full_name}</p>
                            <p className="text-muted-foreground text-xs">{client.company}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No client assigned</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default ProjectDetailsCard;