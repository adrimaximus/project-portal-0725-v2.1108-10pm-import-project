import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Service } from '@/components/request/ServiceSelection';
import { toast } from "sonner";
import { PlusCircle, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ServiceFormDialog from '@/components/settings/ServiceFormDialog';
import Icon from '@/components/Icon';
import { cn } from '@/lib/utils';

const ServicesManager = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('services').select('*').order('title');
    if (error) {
      toast.error("Failed to fetch services.");
    } else {
      setServices(data as Service[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAddService = () => {
    setSelectedService(null);
    setIsFormDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsFormDialogOpen(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    const { error } = await supabase.from('services').delete().eq('id', serviceId);
    if (error) {
      toast.error("Failed to delete service.");
    } else {
      toast.success("Service deleted successfully.");
      fetchServices();
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Add, edit, or remove services available on the request page.
          </p>
          <Button onClick={handleAddService} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">Loading...</TableCell>
                </TableRow>
              ) : services.length > 0 ? (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", service.icon_color)}>
                          <Icon name={service.icon as any} className="h-5 w-5" />
                        </div>
                        {service.title}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{service.description}</TableCell>
                    <TableCell>{service.is_featured ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditService(service)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteService(service.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">No services found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <ServiceFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        onSuccess={() => {
          fetchServices();
          setIsFormDialogOpen(false);
        }}
        service={selectedService}
      />
    </>
  );
};

export default ServicesManager;