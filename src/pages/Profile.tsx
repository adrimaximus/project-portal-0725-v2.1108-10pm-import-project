import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generatePastelColor, getAvatarUrl, getInitials } from "@/lib/utils";
import NotificationPreferencesCard from "@/components/settings/NotificationPreferencesCard";

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    onSuccess: (data) => {
      if (data) {
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
      }
    }
  });

  const { mutate: updateProfile, isPending: isUpdatingProfile } = useMutation({
    mutationFn: async ({ firstName, lastName, avatarUrl }: { firstName: string; lastName: string; avatarUrl?: string }) => {
      if (!user?.id) throw new Error("User not found");
      const updates: { first_name: string; last_name: string; avatar_url?: string } = {
        first_name: firstName,
        last_name: lastName,
      };
      if (avatarUrl) {
        updates.avatar_url = avatarUrl;
      }
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Profile updated successfully!");
      if (user) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
      }
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  const handleAvatarUpload = async () => {
    if (!avatarFile || !user?.id) return;
    setIsUploading(true);
    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile({ firstName, lastName, avatarUrl: publicUrl });
      setAvatarFile(null);
    } catch (error: any) {
      toast.error(`Failed to upload avatar: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (avatarFile) {
      await handleAvatarUpload();
    } else {
      updateProfile({ firstName, lastName });
    }
  };

  if (isLoadingProfile || !user) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={avatarFile ? URL.createObjectURL(avatarFile) : getAvatarUrl(user)} alt={user.first_name || ''} />
                      <AvatarFallback style={generatePastelColor(user.id)}>{getInitials(user.first_name)}</AvatarFallback>
                    </Avatar>
                    <Label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90">
                      <Upload className="h-4 w-4" />
                    </Label>
                    <Input id="avatar-upload" type="file" className="hidden" onChange={(e) => e.target.files && setAvatarFile(e.target.files[0])} accept="image/*" />
                  </div>
                  <div className="flex-grow">
                    <h2 className="text-xl font-semibold">{user.first_name} {user.last_name}</h2>
                    <p className="text-muted-foreground">{user.email}</p>
                    {profile?.role && <Badge className="mt-1">{profile.role}</Badge>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
                <Button type="submit" disabled={isUpdatingProfile || isUploading}>
                  {(isUpdatingProfile || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <div>
          <NotificationPreferencesCard />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;