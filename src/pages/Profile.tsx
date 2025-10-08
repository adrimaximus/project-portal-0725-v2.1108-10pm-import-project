import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generatePastelColor, getAvatarUrl, getInitials } from "@/lib/utils";
import NotificationPreferencesCard from "@/components/settings/NotificationPreferencesCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('system');

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setAvatarPreview(user.avatar_url || null);
      setTheme(user.theme || 'system');
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);
    let avatarUrl = user.avatar_url;

    if (avatarFile) {
      const filePath = `${user.id}/${Date.now()}_${avatarFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile);

      if (uploadError) {
        toast.error(`Avatar upload failed: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      avatarUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl,
        theme: theme,
      })
      .eq("id", user.id);

    if (error) {
      toast.error(`Profile update failed: ${error.message}`);
    } else {
      // Also update auth user metadata
      await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          avatar_url: avatarUrl,
        },
      });
      toast.success("Profile updated successfully!");
      await refreshUser();
    }
    setLoading(false);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Public Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview || undefined} alt={user.first_name || ""} />
                <AvatarFallback style={{ backgroundColor: generatePastelColor(user.id) }}>{getInitials(user.first_name, user.email)}</AvatarFallback>
              </Avatar>
              <Label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90"
              >
                <Camera className="h-4 w-4" />
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                className="hidden"
                onChange={handleAvatarChange}
                accept="image/*"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{`${firstName} ${lastName}`}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <Badge className="mt-2 capitalize">{user.role}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme" className="w-[180px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Select the theme for the dashboard.
            </p>
          </div>
        </CardContent>
      </Card>

      <NotificationPreferencesCard />

      <div className="flex justify-end">
        <Button onClick={handleUpdateProfile} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Profile
        </Button>
      </div>
    </div>
  );
}