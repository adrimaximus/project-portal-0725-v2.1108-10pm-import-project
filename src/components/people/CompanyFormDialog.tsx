import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Company, CompanyProperty } from '@/types';
import { ScrollArea } from '../ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface CompanyFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    company: Company | null;
}

const formSchema = z.object({
    name: z.string().min(1, "Company name is required"),
    legal_name: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    logo_url: z.string().url().optional().nullable().or(z.literal('')),
    custom_properties: z.record(z.any()).optional()
});

type CompanyFormData = z.infer<typeof formSchema>;

const CompanyFormDialog: React.FC<CompanyFormDialogProps> = ({ open, onOpenChange, company }) => {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: properties = [], isLoading: isLoadingProperties } = useQuery<CompanyProperty[]>({
        queryKey: ['company_properties'],
        queryFn: async () => {
            const { data, error } = await supabase.from('company_properties').select('*').order('label');
            if (error) throw error;
            return data;
        },
    });

    const form = useForm<CompanyFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {},
    });

    useEffect(() => {
        if (open) {
            if (company) {
                form.reset({
                    name: company.name,
                    legal_name: company.legal_name,
                    address: company.address,
                    logo_url: company.logo_url,
                    custom_properties: company.custom_properties || {},
                });
            } else {
                form.reset({
                    name: '',
                    legal_name: '',
                    address: '',
                    logo_url: '',
                    custom_properties: {},
                });
            }
        }
    }, [company, open, form]);

    const onSubmit = async (values: CompanyFormData) => {
        setIsSubmitting(true);
        
        const submissionData = {
            ...values,
            custom_properties: values.custom_properties || {},
        };

        let error;
        if (company) {
            ({ error } = await supabase.from('companies').update(submissionData).eq('id', company.id));
        } else {
            ({ error } = await supabase.from('companies').insert(submissionData));
        }

        if (error) {
            toast.error(`Failed to save company: ${error.message}`);
        } else {
            toast.success(`Company ${company ? 'updated' : 'created'} successfully.`);
            queryClient.invalidateQueries({ queryKey: ['companies'] });
            onOpenChange(false);
        }
        setIsSubmitting(false);
    };

    const renderCustomField = (prop: CompanyProperty) => {
        return (
            <FormField
                key={prop.id}
                control={form.control}
                name={`custom_properties.${prop.name}`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{prop.label}</FormLabel>
                        <FormControl>
                            <Input 
                                type={prop.type === 'number' ? 'number' : prop.type === 'date' ? 'date' : 'text'}
                                {...field}
                                value={field.value ?? ''}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{company ? 'Edit Company' : 'Add New Company'}</DialogTitle>
                    <DialogDescription>
                        {company ? `Updating information for ${company.name}.` : 'Enter the details for the new company.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <ScrollArea className="max-h-[60vh] p-1">
                            <div className="space-y-4 pr-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Name</FormLabel>
                                            <FormControl><Input placeholder="e.g., Acme Inc." {...field} /></FormControl>
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
                                            <FormControl><Input placeholder="e.g., Acme Corporation" {...field} value={field.value ?? ''} /></FormControl>
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
                                            <FormControl><Input placeholder="123 Main St, Anytown, USA" {...field} value={field.value ?? ''} /></FormControl>
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
                                            <FormControl><Input placeholder="https://example.com/logo.png" {...field} value={field.value ?? ''} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {isLoadingProperties ? (
                                    <div className="flex items-center justify-center p-4">
                                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : properties.map(renderCustomField)}
                            </div>
                        </ScrollArea>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {company ? 'Save Changes' : 'Create Company'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default CompanyFormDialog;