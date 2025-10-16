import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Person } from '@/types';
import { Loader2 } from 'lucide-react';

interface PersonFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPersonCreated: (person: Person) => void;
}

const formSchema = z.object({
    full_name: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address").optional().or(z.literal('')),
    phone: z.string().optional(),
});

type PersonFormData = z.infer<typeof formSchema>;

const PersonFormDialog: React.FC<PersonFormDialogProps> = ({ open, onOpenChange, onPersonCreated }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<PersonFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            full_name: '',
            email: '',
            phone: '',
        },
    });

    useEffect(() => {
        if (!open) {
            form.reset();
        }
    }, [open, form]);

    const onSubmit = async (values: PersonFormData) => {
        setIsSubmitting(true);
        
        const contact = {
            emails: values.email ? [values.email] : [],
            phones: values.phone ? [values.phone] : [],
        };

        const { data, error } = await supabase
            .from('people')
            .insert({ 
                full_name: values.full_name,
                email: values.email || null,
                phone: values.phone || null,
                contact: contact,
             })
            .select()
            .single();

        if (error) {
            toast.error(`Failed to create client: ${error.message}`);
        } else if (data) {
            toast.success(`Client "${data.full_name}" created successfully.`);
            onPersonCreated(data as Person);
            onOpenChange(false);
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                    <DialogDescription>
                        Enter the details for the new client.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl><Input type="email" placeholder="e.g., john.doe@example.com" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl><Input type="tel" placeholder="e.g., +62 812 3456 7890" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Client
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default PersonFormDialog;