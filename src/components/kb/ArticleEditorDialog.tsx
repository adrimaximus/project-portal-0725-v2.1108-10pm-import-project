import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import RichTextEditor from '../RichTextEditor';
import { KbFolder } from '@/types';

interface ArticleValues {
  id?: string;
  title: string;
  content: string;
  folder_id: string;
}

interface ArticleEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: KbFolder;
  article?: ArticleValues | null;
  onSuccess: () => void;
}

const articleSchema = z.object({
  title: z.string().min(1, "Title is required."),
  content: z.string().min(10, "Content is too short.").optional().or(z.literal('')),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

const ArticleEditorDialog = ({ open, onOpenChange, folder, article, onSuccess }: ArticleEditorDialogProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = !!article;

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      content: '',
    }
  });

  useEffect(() => {
    if (article) {
      form.reset({
        title: article.title,
        content: article.content || '',
      });
    } else {
      form.reset({
        title: '',
        content: '',
      });
    }
  }, [article, form]);

  const onSubmit = async (values: ArticleFormValues) => {
    setIsSaving(true);
    
    const articleData = {
      ...values,
      folder_id: folder.id,
      content: values.content ? JSON.parse(JSON.stringify(values.content)) : null, // Ensure content is valid JSONB
    };

    const promise = isEditMode && article?.id
      ? supabase.from('kb_articles').update(articleData).eq('id', article.id)
      : supabase.from('kb_articles').insert(articleData);

    const { error } = await promise;
    setIsSaving(false);

    if (error) {
      toast.error(`Failed to save article: ${error.message}`);
    } else {
      toast.success(`Article "${values.title}" saved successfully.`);
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Article' : 'Create New Article'}</DialogTitle>
          <DialogDescription>
            Fill in the details for your article. It will be saved in the "{folder.name}" folder.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="content" render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <RichTextEditor value={field.value || ''} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Article
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ArticleEditorDialog;