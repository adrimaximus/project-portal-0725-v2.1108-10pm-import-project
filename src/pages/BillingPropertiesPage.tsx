import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

type CustomProperty = {
  id: string;
  label: string;
  type: string;
  category: string;
};

const fetchBillingProperties = async (): Promise<CustomProperty[]> => {
  const { data, error } = await supabase
    .from('custom_properties')
    .select('id, label, type, category')
    .eq('category', 'billing');

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const BillingPropertiesPage = () => {
  const { data: properties, isLoading, error } = useQuery<CustomProperty[]>({
    queryKey: ['billingProperties'],
    queryFn: fetchBillingProperties,
  });

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/settings">Settings</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/settings/properties">Custom Properties</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Billing Properties</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-2xl font-bold tracking-tight mt-2">Billing Properties</h1>
            <p className="text-muted-foreground">
              Modify and create billing properties.
            </p>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Property
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Custom Properties</CardTitle>
            <CardDescription>
              Create and manage custom fields for your billing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : error instanceof Error ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-destructive">
                      Error: {error.message}
                    </TableCell>
                  </TableRow>
                ) : properties && properties.length > 0 ? (
                  properties.map((prop) => (
                    <TableRow key={prop.id}>
                      <TableCell className="font-medium">{prop.label}</TableCell>
                      <TableCell>
                        <span className="bg-muted px-2 py-1 rounded-md text-sm">{prop.type}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">
                      No custom properties found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default BillingPropertiesPage;