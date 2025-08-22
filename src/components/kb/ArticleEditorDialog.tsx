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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ArticleValues {
  id?: string;
  title: string;
  content: string;
  folder_id: string;
}

interface ArticleEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: KbFolder[];
  folder?: KbFolder | null;
  article?: ArticleValues | null;
  onSuccess: () => void;
}

const articleSchema = z.object({
  title: z.string().min(1, "Title is required."),
  content: z.string().min(10, "Content is too short.").optional().or(z.literal('')),
  folder_id: z.string().min(1, "Please select a folder."),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

const ArticleEditorDialog = ({ open, onOpenChange, folders, folder, article, onSuccess }: ArticleEditorDialogProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = !!article;

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      content: '',
      folder_id: '',
    }
  });

  useEffect(() => {
    if (open) {
      if (article) {
        form.reset({
          title: article.title,
          content: article.content || '',
          folder_id: article.folder_id,
        });
      } else {
        form.reset({
          title: '',
          content: '',
          folder_id: folder?.id || '',
        });
      }
    }
  }, [article, folder, open, form]);

  const onSubmit = async (values: ArticleFormValues) => {
    setIsSaving(true);
    
    const articleData = {
      ...values,
      content: values.content ? JSON.parse(JSON.stringify(values.content)) : null,
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
            {folder 
              ? `This article will be saved in the "${folder.name}" folder.`
              : 'Fill in the details for your article and select a folder to save it in.'
            }
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
            <FormField
              control={form.control}
              name="folder_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!folder || isEditMode}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a folder to save this article in..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {folders.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
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