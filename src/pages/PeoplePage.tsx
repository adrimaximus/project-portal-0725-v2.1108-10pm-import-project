import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Person } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, LayoutGrid, List, Users, Trash2, Edit } from "lucide-react";
import PersonCard from "@/components/people/PersonCard";
import PersonFormDialog from "@/components/people/PersonFormDialog";
import { toast } from "sonner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatDistanceToNow } from "date-fns";
import { generatePastelColor, getAvatarUrl } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import PersonProfileSheet from "@/components/people/PersonProfileSheet";

const usePeople = () => {
  return useQuery({
    queryKey: ['people'],
    queryFn: async (): Promise<Person[]> => {
      const { data, error } = await supabase.rpc('get_people_with_details');
      if (error) throw error;
      return data.map(person => ({
        ...person,
        avatar_url: getAvatarUrl(person),
        tags: person.tags ? [...person.tags].sort((a, b) => a.name.localeCompare(b.name)) : [],
      }));
    },
  });
};

const PeoplePage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [deletingPerson, setDeletingPerson] = useState<Person | null>(null);
  const [viewingPerson, setViewingPerson] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const queryClient = useQueryClient();

  const { data: people = [], isLoading } = usePeople();

  const { mutate: deletePerson, isPending: isDeleting } = useMutation({
    mutationFn: async (personId: string) => {
      const { error } = await supabase.from('people').delete().eq('id', personId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Person deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ['people'] });
      setDeletingPerson(null);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const filteredPeople = useMemo(() => {
    return people.filter(person =>
      person.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.company && person.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.job_title && person.job_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.tags && person.tags.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  }, [people, searchTerm]);

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingPerson(null);
    setIsFormOpen(true);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">People</h1>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <Input
            placeholder="Search people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
          <ToggleGroup type="single" value={view} onValueChange={(value) => value && setView(value as 'grid' | 'list')}>
            <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>
          <Button onClick={handleAddNew} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Person
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPeople.map(person => (
            <PersonCard
              key={person.id}
              person={person}
              onViewProfile={setViewingPerson}
              onEdit={handleEdit}
              onDelete={setDeletingPerson}
            />
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPeople.map(person => (
                <TableRow key={person.id} onClick={() => setViewingPerson(person)} className="cursor-pointer">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={person.avatar_url} />
                        <AvatarFallback style={generatePastelColor(person.id)}>
                          {person.full_name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{person.full_name}</p>
                        <p className="text-sm text-muted-foreground">{person.job_title}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{person.company}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {person.tags?.slice(0, 2).map(tag => (
                        <Badge key={tag.id} variant="secondary" style={{ backgroundColor: tag.color, color: '#fff' }}>{tag.name}</Badge>
                      ))}
                      {person.tags && person.tags.length > 2 && (
                        <Badge variant="outline">+{person.tags.length - 2}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDistanceToNow(new Date(person.updated_at), { addSuffix: true })}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(person); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeletingPerson(person); }}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <PersonFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        person={editingPerson}
      />

      <AlertDialog open={!!deletingPerson} onOpenChange={() => setDeletingPerson(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {deletingPerson?.full_name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingPerson && deletePerson(deletingPerson.id)} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PersonProfileSheet
        person={viewingPerson}
        onOpenChange={(isOpen) => !isOpen && setViewingPerson(null)}
        onEdit={handleEdit}
        onDelete={setDeletingPerson}
      />
    </div>
  );
};

export default PeoplePage;