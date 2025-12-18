import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Building2, 
  Globe, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Briefcase,
  ArrowLeft,
  MoreHorizontal,
  Edit,
  Trash2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CompanyFormDialog from "@/components/people/CompanyFormDialog";
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
import { useToast } from "@/hooks/use-toast";

const CompanyProfilePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: company, isLoading, refetch } = useQuery({
    queryKey: ["company", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_company_details_by_slug', { p_slug: slug });

      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Company not found");
      
      return data[0];
    },
  });

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', company?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company deleted successfully",
      });
      navigate('/people?view=companies');
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto py-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Company Not Found</h1>
        <Button onClick={() => navigate('/people')}>Back to People</Button>
      </div>
    );
  }

  const customProps = company.custom_properties || {};
  const contacts = company.contacts || [];
  const projects = company.projects || [];

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-5xl animate-in fade-in duration-500">
      <Button 
        variant="ghost" 
        className="mb-4 pl-0 hover:pl-2 transition-all" 
        onClick={() => navigate('/people?view=companies')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Companies
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-muted">
                  <AvatarImage src={company.logo_url} alt={company.name} className="object-cover" />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    <Building2 className="h-10 w-10" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl font-bold">{company.name}</CardTitle>
                  {company.legal_name && (
                    <p className="text-sm text-muted-foreground mt-1">{company.legal_name}</p>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsFormOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {company.address && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                    <span>{company.address}</span>
                  </div>
                )}
                {/* Display custom properties that look like standard fields */}
                {Object.entries(customProps).map(([key, value]) => {
                  if (key === 'website' || key === 'url') {
                    return (
                      <div key={key} className="flex items-center gap-3 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {value as string}
                        </a>
                      </div>
                    );
                  }
                  if (key === 'phone' || key === 'contact') {
                    return (
                      <div key={key} className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{value as string}</span>
                      </div>
                    );
                  }
                  if (key === 'email') {
                    return (
                      <div key={key} className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <a href={`mailto:${value}`} className="hover:underline">{value as string}</a>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Other Custom Properties */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Additional Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(customProps).map(([key, value]) => {
                    if (['website', 'url', 'phone', 'contact', 'email'].includes(key)) return null;
                    return (
                      <div key={key} className="space-y-1">
                        <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-sm font-medium">{String(value)}</p>
                      </div>
                    );
                  })}
                  {Object.keys(customProps).length === 0 && (
                    <p className="text-sm text-muted-foreground italic col-span-2">No additional details available.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-primary" />
                Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map((project: any) => (
                    <div 
                      key={project.id} 
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/projects/${project.slug}`)}
                    >
                      <span className="font-medium">{project.name}</span>
                      <Badge variant={project.status === 'Completed' ? 'secondary' : 'default'}>
                        {project.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p>No projects associated with this company.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Contacts/People Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                Key Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contacts.map((contact: any) => (
                  <div 
                    key={contact.id} 
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/people/${contact.slug}`)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={contact.avatar_url} />
                      <AvatarFallback>{contact.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors truncate">
                        {contact.full_name}
                      </p>
                      {contact.job_title && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{contact.job_title}</p>
                      )}
                    </div>
                  </div>
                ))}
                {contacts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No contacts linked.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <CompanyFormDialog 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen}
        company={company}
        onSuccess={() => refetch()}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the company
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CompanyProfilePage;