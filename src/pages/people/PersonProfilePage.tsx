import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { usePerson } from '@/hooks/usePerson';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Briefcase, Cake, Edit, Instagram, Linkedin, Mail, MapPin, MoreVertical, Phone, Twitter, User as UserIcon, Users, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatInJakarta, generatePastelColor, getInitials, getAvatarUrl, formatPhoneNumberForApi } from '@/lib/utils';
import PersonFormDialog from '@/components/people/PersonFormDialog';
import { Person as BasePerson, ContactProperty, User } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import WhatsappIcon from '@/components/icons/WhatsappIcon';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Person = BasePerson & { company_id?: string | null };

const fetchUserProfile = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
  return {
    id: data.id,
    name: fullName || data.email,
    email: data.email,
    avatar_url: getAvatarUrl(data.avatar_url, data.id),
    initials: getInitials(fullName, data.email) || 'NN',
    role: data.role,
  };
};

const PersonProfileSkeleton = () => (
  <PortalLayout>
    <Skeleton className="h-8 w-32 mb-6" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  </PortalLayout>
);

const PersonProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: basePerson, isLoading, error } = usePerson(id!);
  const person = basePerson as Person | null;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: company } = useQuery({
    queryKey: ['company_details_for_person', person?.id],
    queryFn: async () => {
        if (!person) return null;
        const companyId = person.company_id;
        const companyName = person.company?.trim();

        if (!companyId && !companyName) return null;

        let query = supabase.from('companies').select('logo_url');
        if (companyId) {
            query = query.eq('id', companyId);
        } else if (companyName) {
            query = query.ilike('name', companyName);
        } else {
            return null;
        }

        const { data, error } = await query.single();

        if (error && error.code !== 'PGRST116') {
            console.warn(`Could not fetch company logo for person ${person.id}:`, error.message);
        }
        return data;
    },
    enabled: !!person,
  });

  const companyLogoUrl = company?.logo_url;

  const { data: customProperties = [] } = useQuery({
    queryKey: ['contact_properties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contact_properties').select('*').eq('is_default', false);
      if (error) throw error;
      return data as ContactProperty[];
    }
  });

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'master admin';

  const handleDelete = async () => {
    if (!person) return;

    setIsDeleteDialogOpen(false);
    await queryClient.cancelQueries({ queryKey: ['people'] });
    const previousPeople = queryClient.getQueryData<Person[]>(['people']);
    queryClient.setQueryData<Person[]>(['people'], (old) =>
      old ? old.filter((p) => p.id !== person.id) : []
    );
    navigate('/people');

    const { error } = await supabase.from('people').delete().eq('id', person.id);

    if (error) {
      queryClient.setQueryData(['people'], previousPeople);
      toast.error(`Failed to delete ${person.full_name}.`);
    } else {
      toast.success(`${person.full_name} has been deleted.`);
      queryClient.invalidateQueries({ queryKey: ['people'] });
    }
  };

  if (isLoading) return <PersonProfileSkeleton />;

  if (error || !person) {
    toast.error("Could not load person's profile.");
    navigate('/people');
    return null;
  }

  const firstEmail = person.contact?.emails?.[0];
  const firstPhone = person.contact?.phones?.[0] || person.phone;
  const whatsappLink = firstPhone ? `https://wa.me/${formatPhoneNumberForApi(firstPhone)}` : null;

  const customPropertiesWithValue = customProperties.filter(prop => person.custom_properties && person.custom_properties[prop.name]);

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Button variant="ghost" className="text-muted-foreground" onClick={() => navigate('/people')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to People
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-end">
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setIsFormOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Profile
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardHeader>
              <CardContent className="pt-0 flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={person.avatar_url} alt={person.full_name} />
                  <AvatarFallback style={generatePastelColor(person.id)} className="text-3xl">
                    <UserIcon className="h-10 w-10 text-white" />
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">{person.full_name}</h2>
                <p className="text-muted-foreground">{person.job_title || 'No title'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Contact Info</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {firstEmail && <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${firstEmail}`} className="truncate hover:underline">{firstEmail}</a></div>}
                {whatsappLink && <div className="flex items-center gap-3"><WhatsappIcon className="h-4 w-4 text-muted-foreground" /><a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="truncate hover:underline text-primary">{firstPhone}</a></div>}
                {person.address?.formatted_address && <div className="flex items-start gap-3"><MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" /><span>{person.address.formatted_address}</span></div>}
                {person.birthday && <div className="flex items-center gap-3"><Cake className="h-4 w-4 text-muted-foreground" /><span>{formatInJakarta(person.birthday, 'MMMM d, yyyy')}</span></div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Social Links</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {person.social_media?.linkedin && <div className="flex items-center gap-3"><Linkedin className="h-4 w-4 text-muted-foreground" /><a href={person.social_media.linkedin} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline">LinkedIn</a></div>}
                {person.social_media?.twitter && <div className="flex items-center gap-3"><Twitter className="h-4 w-4 text-muted-foreground" /><a href={person.social_media.twitter} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline">Twitter</a></div>}
                {person.social_media?.instagram && <div className="flex items-center gap-3"><Instagram className="h-4 w-4 text-muted-foreground" /><a href={person.social_media.instagram} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline">Instagram</a></div>}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader><CardTitle>Work Information</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-4">
                  {companyLogoUrl ? (
                    <img src={companyLogoUrl} alt={`${person.company || ''} logo`} className="h-10 w-10 object-contain rounded-md flex-shrink-0" />
                  ) : (
                    <Briefcase className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold">{person.job_title || 'Not specified'}</p>
                    <p className="text-muted-foreground">{person.company || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Users className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Department</p>
                    <p className="text-muted-foreground">{person.department || 'Not specified'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {customPropertiesWithValue.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Additional Information</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {customPropertiesWithValue.map(prop => (
                    <div key={prop.id} className="flex items-start gap-3">
                      <span className="font-semibold w-24 flex-shrink-0">{prop.label}:</span>
                      <span className="text-muted-foreground">{person.custom_properties?.[prop.name]}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader><CardTitle>Related Projects</CardTitle></CardHeader>
              <CardContent>
                {person.projects && person.projects.length > 0 ? (
                  <div className="space-y-2">
                    {person.projects.map(project => (
                      <Link key={project.id} to={`/projects/${project.slug}`} className="block p-2 rounded-md hover:bg-muted">
                        <p className="font-medium">{project.name}</p>
                      </Link>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No projects linked yet.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {person.tags && person.tags.length > 0 ? (
                  person.tags.map(tag => (
                    <Badge key={tag.id} variant="outline" style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}>
                      {tag.name}
                    </Badge>
                  ))
                ) : <p className="text-sm text-muted-foreground">No tags assigned.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{person.notes || 'No notes for this contact.'}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <PersonFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        person={person}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the record for {person?.full_name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PortalLayout>
  );
};

export default PersonProfilePage;