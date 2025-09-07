import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export interface Company {
  id: string;
  name: string;
  legal_name: string | null;
  address: string | null;
  billing_address: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

const companySchema = z.object({
    name: z.string().min(1, "Company name is required"),
    legal_name: z.string().optional(),
    address: z.string().optional(),
    billing_address: z.string().optional(),
    logo_url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    company: Company | null;
}

const CompanyFormDialog = ({ open, onOpenChange, company }: CompanyFormDialogProps) => {
    const queryClient = useQueryClient();
    const form = useForm<CompanyFormData>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            name: '',
            legal_name: '',
            address: '',
            billing_address: '',
            logo_url: '',
        }
    });

    useEffect(() => {
        if (company) {
            form.reset({
                name: company.name,
                legal_name: company.legal_name || '',
                address: company.address || '',
                billing_address: company.billing_address || '',
                logo_url: company.logo_url || '',
            });
        } else {
            form.reset({
                name: '',
                legal_name: '',
                address: '',
                billing_address: '',
                logo_url: '',
            });
        }
    }, [company, open, form]);

    const onSubmit = async (values: CompanyFormData) => {
        const { data, error } = await supabase
            .from('companies')
            .upsert({
                id: company?.id,
                ...values
            })
            .select()
            .single();

        if (error) {
            toast.error("Failed to save company.", { description: error.message });
        } else {
            toast.success(`Company "${data.name}" saved successfully.`);
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{company ? 'Edit Company' : 'Add New Company'}</DialogTitle>
                    <DialogDescription>
                        {company ? `Update details for ${company.name}.` : 'Add a new company to your list.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Acme Inc." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="legal_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Legal Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Acme Corporation" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123 Main St, Anytown, USA" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="logo_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Logo URL</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://example.com/logo.png" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CompanyFormDialog;