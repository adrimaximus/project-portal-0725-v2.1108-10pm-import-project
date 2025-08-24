import { useState } from 'react';
import PortalLayout from "@/components/PortalLayout";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ContactProperty } from '@/types';

const ContactPropertiesPage = () => {
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['contact_properties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contact_properties').select('*').order('label');
      if (error) throw error;
      return data as ContactProperty[];
    }
  });

  return (
    <PortalLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/people">People</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Contact Properties</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contact Properties</h1>
            <p className="text-muted-foreground">Modify and create contact properties.</p>
          </div>
          <Button disabled>
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Property
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Properties</CardTitle>
            <CardDescription>These are the fields available for your contacts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center">Loading properties...</TableCell></TableRow>
                ) : properties.map(prop => (
                  <TableRow key={prop.id}>
                    <TableCell className="font-medium">{prop.label}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{prop.type}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" disabled>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default ContactPropertiesPage;