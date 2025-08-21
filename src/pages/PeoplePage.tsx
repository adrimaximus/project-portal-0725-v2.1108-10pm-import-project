import { useState, useMemo } from "react";
import PortalLayout from "@/components/PortalLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, PlusCircle, Search, Trash2, Edit, User as UserIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { generateVibrantGradient } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PersonFormDialog from "@/components/people/PersonFormDialog";

export interface Person {
  id: string;
  full_name: string;
  contact?: { email?: string; phone?: string };
  company?: string;
  job_title?: string;
  department?: string;
  social_media?: { linkedin?: string; twitter?: string };
  birthday?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  projects?: { id: string; name: string }[];
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
      const { data, error } = await supabase.from('people').select('*').order('full_name');
      if (error) throw error;
      return data as Person[];
    }
  });

  const filteredPeople = useMemo(() => {
    return people.filter(person =>
      person.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.company && person.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.job_title && person.job_title.toLowerCase().includes(searchTerm.toLowerCase()))
    );
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

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Full Name</TableHead>
                <TableHead>Company & Title</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : filteredPeople.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center h-24">No people found.</TableCell></TableRow>
              ) : (
                filteredPeople.map(person => (
                  <TableRow key={person.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback style={generateVibrantGradient(person.id)}>
                            <UserIcon className="h-5 w-5 text-white" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{person.full_name}</p>
                          <p className="text-sm text-muted-foreground">{person.contact?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{person.company || '-'}</p>
                      <p className="text-sm text-muted-foreground">{person.job_title || '-'}</p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(person.updated_at), { addSuffix: true, locale: id })}
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
                ))
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