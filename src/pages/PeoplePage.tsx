import { useState, useMemo } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, PlusCircle, Search, Trash2, Edit, User as UserIcon, Linkedin, Twitter, Instagram, Mail, Briefcase, Contact, History, Tag as TagIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { generateVibrantGradient } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PersonFormDialog from "@/components/people/PersonFormDialog";
import { Badge } from "@/components/ui/badge";
import WhatsappIcon from "../components/icons/WhatsappIcon";

export interface Person {
  id: string;
  full_name: string;
  avatar_url?: string;
  user_id?: string;
  contact?: { email?: string; phone?: string };
  company?: string;
  job_title?: string;
  department?: string;
  social_media?: { linkedin?: string; twitter?: string; instagram?: string };
  birthday?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  projects?: { id: string; name: string, slug: string }[];
  tags?: { id: string; name: string; color: string }[];
}

const PeoplePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const queryClient = useQueryClient();

  const { data: people = [], isLoading } = useQuery({
    queryKey: ['people'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_people_with_details');
      if (error) throw error;
      return data as Person[];
    }
  });

  const filteredPeople = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return people;
    }
    return people.filter(person => {
      const fullName = person.full_name?.toLowerCase() || '';
      const company = person.company?.toLowerCase() || '';
      const jobTitle = person.job_title?.toLowerCase() || '';
      return fullName.includes(term) || company.includes(term) || jobTitle.includes(term);
    });
  }, [people, searchTerm]);

  const handleAddNew = () => {
    setPersonToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (person: Person) => {
    setPersonToEdit(person);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!personToDelete) return;
    const { error } = await supabase.from('people').delete().eq('id', personToDelete.id);
    if (error) {
      toast.error(`Failed to delete ${personToDelete.full_name}.`);
    } else {
      toast.success(`${personToDelete.full_name} has been deleted.`);
      queryClient.invalidateQueries({ queryKey: ['people'] });
    }
    setPersonToDelete(null);
  };

  const formatSocialLink = (platform: 'linkedin' | 'twitter' | 'instagram', value: string) => {
    if (!value) return null;
    if (value.startsWith('http')) return value;
    const username = value.startsWith('@') ? value.substring(1) : value;
    switch (platform) {
      case 'instagram': return `https://instagram.com/${username}`;
      case 'twitter': return `https://twitter.com/${username}`;
      case 'linkedin': return `https://linkedin.com/in/${username}`;
      default: return null;
    }
  };

  const getSocialDisplay = (value: string) => {
    if (!value) return '';
    if (value.startsWith('@')) return value;
    try {
      const url = new URL(value);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const handle = pathParts[pathParts.length - 1];
      return handle ? `@${handle}` : value;
    } catch (e) {
      return `@${value}`;
    }
  };

  const formatWhatsappLink = (phone: string | undefined): string | null => {
    if (!phone) return null;
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    return `https://wa.me/${cleaned}`;
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">People</h1>
            <p className="text-muted-foreground">Manage your contacts and connections.</p>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Person
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, company, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Name
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Work
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <Contact className="h-4 w-4" />
                    Contact
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4" />
                    Tags
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Last Activity
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : filteredPeople.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">No people found.</TableCell></TableRow>
              ) : (
                filteredPeople.map(person => {
                  const linkedinUrl = formatSocialLink('linkedin', person.social_media?.linkedin || '');
                  const twitterUrl = formatSocialLink('twitter', person.social_media?.twitter || '');
                  const instagramUrl = formatSocialLink('instagram', person.social_media?.instagram || '');
                  const whatsappUrl = formatWhatsappLink(person.contact?.phone);
                  return (
                    <TableRow key={person.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={person.avatar_url} />
                            <AvatarFallback style={generateVibrantGradient(person.id)}>
                              <UserIcon className="h-5 w-5 text-white" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{person.full_name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{person.job_title || '-'}</p>
                        <p className="text-sm text-muted-foreground">
                          {person.department}{person.department && person.company ? ' at ' : ''}{person.company}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {person.contact?.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <a href={`mailto:${person.contact.email}`} className="text-sm text-muted-foreground hover:text-primary truncate">{person.contact.email}</a>
                            </div>
                          )}
                          {person.contact?.phone && (
                            <div className="flex items-center gap-1.5">
                              <WhatsappIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              {whatsappUrl ? (
                                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary">{person.contact.phone}</a>
                              ) : (
                                <span className="text-sm text-muted-foreground">{person.contact.phone}</span>
                              )}
                            </div>
                          )}
                          {instagramUrl && (
                            <div className="flex items-center gap-1.5">
                              <Instagram className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary truncate">{getSocialDisplay(person.social_media?.instagram || '')}</a>
                            </div>
                          )}
                          {linkedinUrl && (
                            <div className="flex items-center gap-1.5">
                              <Linkedin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary truncate">{getSocialDisplay(person.social_media?.linkedin || '')}</a>
                            </div>
                          )}
                          {twitterUrl && (
                            <div className="flex items-center gap-1.5">
                              <Twitter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary truncate">{getSocialDisplay(person.social_media?.twitter || '')}</a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(person.tags || []).map(tag => (
                            <Badge key={tag.id} variant="outline" style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}>
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(person.updated_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleEdit(person)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setPersonToDelete(person)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <PersonFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        person={personToEdit}
      />

      <AlertDialog open={!!personToDelete} onOpenChange={(open) => !open && setPersonToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the record for {personToDelete?.full_name}. This action cannot be undone.
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

export default PeoplePage;