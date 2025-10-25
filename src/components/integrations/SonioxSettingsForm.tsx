"use client";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";

const formSchema = z.object({
  apiKey: z.string().min(1, "API Key is required."),
});

const SonioxSettingsForm = () => {
  const { user, refetchProfile } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: "",
    },
  });

  useEffect(() => {
    if (user?.profile?.soniox_settings?.apiKey) {
      form.reset({ apiKey: user.profile.soniox_settings.apiKey });
    } else {
      form.reset({ apiKey: "" });
    }
  }, [user, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!user) throw new Error("You must be logged in to save settings.");
      
      const { error } = await supabase
        .from("profiles")
        .update({
          soniox_settings: {
            apiKey: values.apiKey,
          },
        })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Soniox API key saved successfully.");
      await refetchProfile();
    },
    onError: (error) => {
      toast.error("Failed to save API key.", { description: error.message });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-xl">
        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Soniox API Key</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••••••••••••••" {...field} />
              </FormControl>
              <FormDescription>
                You can find your API key on your{" "}
                <a href="https://soniox.com/account" target="_blank" rel="noopener noreferrer" className="underline">
                  Soniox account dashboard
                </a>.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Configuration"}
        </Button>
      </form>
    </Form>
  );
};

export default SonioxSettingsForm;