import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PortalLayout from '@/components/PortalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import RichTextEditor from '@/components/RichTextEditor';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const articleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  content: z.string().min(10, "Content is too short."),
  cover_image_url: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

const ArticleEditorPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(!!slug);
  const [articleId, setArticleId] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: '',
      content: '',
      cover_image_url: '',
    },
  });

  const fetchArticle = useCallback(async (slugToFetch: string) => {
    const { data, error } = await supabase
      .from('kb_articles')
      .select('id, title, content, cover_image_url')
      .eq('slug', slugToFetch)
      .single();

    if (error || !data) {
      toast.error("Article not found.");
      navigate('/knowledge-base');
    } else {
      form.reset({
        title: data.title,
        content: data.content || '',
        cover_image_url: data.cover_image_url || '',
      });
      setArticleId(data.id);
      setCoverImagePreview(data.cover_image_url || null);
    }
    setIsLoading(false);
  }, [navigate, form]);

  useEffect(() => {
    if (slug) {
      fetchArticle(slug);
    }
  }, [slug, fetchArticle]);

  const onSubmit = async (values: ArticleFormValues) => {
    if (!user) {
      toast.error("You must be logged in.");
      return;
    }

    let finalCoverImageUrl = values.cover_image_url;

    if (coverImageFile) {
      const fileExt = coverImageFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('kb-cover-images')
        .upload(filePath, coverImageFile);

      if (uploadError) {
        toast.error("Failed to upload cover image.", { description: uploadError.message });
        return;
      }

      const { data: urlData } = supabase.storage
        .from('kb-cover-images')
        .getPublicUrl(filePath);
      
      finalCoverImageUrl = urlData.publicUrl;
    } else if (!coverImagePreview) {
      finalCoverImageUrl = '';
    }

    const articleData = {
      ...values,
      cover_image_url: finalCoverImageUrl,
      author_id: user.id,
    };

    let response;
    if (articleId) {
      response = await supabase
        .from('kb_articles')
        .update(articleData)
        .eq('id', articleId)
        .select('slug')
        .single();
    } else {
      response = await supabase
        .from('kb_articles')
        .insert(articleData)
        .select('slug')
        .single();
    }

    const { data, error } = response;

    if (error) {
      toast.error("Failed to save article.", { description: error.message });
    } else {
      toast.success(`Article ${articleId ? 'updated' : 'created'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', data.slug] });
      navigate(`/knowledge-base/${data.slug}`);
    }
  };

  if (isLoading) {
    return <PortalLayout><div>Loading editor...</div></PortalLayout>;
  }

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto">
        <Button asChild variant="ghost" className="mb-6">
          <Link to={slug ? `/knowledge-base/${slug}` : "/knowledge-base"}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold mb-6">{slug ? 'Edit Article' : 'Create New Article'}</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a title for your article" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cover_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image (Optional)</FormLabel>
                  <FormControl>
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCoverImageFile(file);
                            setCoverImagePreview(URL.createObjectURL(file));
                          }
                        }}
                        className="max-w-sm"
                      />
                      {coverImagePreview && (
                        <div className="mt-4 relative w-full max-w-md">
                          <img src={coverImagePreview} alt="Cover preview" className="w-full h-auto object-cover rounded-lg border" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={() => {
                              setCoverImageFile(null);
                              setCoverImagePreview(null);
                              field.onChange('');
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Start writing your article here..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {slug ? 'Save Changes' : 'Publish Article'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </PortalLayout>
  );
};

export default ArticleEditorPage;