import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Loader2, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { generatePastelColor, getAvatarUrl, getInitials } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import AvatarCropper from "@/components/settings/AvatarCropper";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import SafeLocalStorage from "@/lib/localStorage";

const Profile = () => {
  const { user, session, refreshUser, logout } = useAuth();
  const queryClient = useQueryClient();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const savedFirstName = SafeLocalStorage.getItem<string>(`profile-form-firstName-${user.id}`);
      const savedLastName = SafeLocalStorage.getItem<string>(`profile-form-lastName-${user.id}`);
      const savedPhone = SafeLocalStorage.getItem<string>(`profile-form-phone-${user.id}`);

      setFirstName(savedFirstName !== null ? savedFirstName : user.first_name || "");
      setLastName(savedLastName !== null ? savedLastName : user.last_name || "");
      setPhone(savedPhone !== null ? savedPhone : user.phone || "");
    }
  }, [user]);

  useEffect(() => {
    if (user && firstName !== (user.first_name || '')) {
      SafeLocalStorage.setItem(`profile-form-firstName-${user.id}`, firstName);
    } else if (user) {
      SafeLocalStorage.removeItem(`profile-form-firstName-${user.id}`);
    }
  }, [firstName, user]);

  useEffect(() => {
    if (user && lastName !== (user.last_name || '')) {
      SafeLocalStorage.setItem(`profile-form-lastName-${user.id}`, lastName);
    } else if (user) {
      SafeLocalStorage.removeItem(`profile-form-lastName-${user.id}`);
    }
  }, [lastName, user]);

  useEffect(() => {
    if (user && phone !== (user.phone || '')) {
      SafeLocalStorage.setItem(`profile-form-phone-${user.id}`, phone);
    } else if (user) {
      SafeLocalStorage.removeItem(`profile-form-phone-${user.id}`);
    }
  }, [phone, user]);

  const hasUnsavedChanges = useMemo(() => {
    if (!user) return false;
    return (
      firstName !== (user.first_name || "") ||
      lastName !== (user.last_name || "") ||
      phone !== (user.phone || "")
    );
  }, [user, firstName, lastName, phone]);

  const canChangePassword = useMemo(() => {
    if (!session?.user) return false;
    return session.user.app_metadata?.provider === 'email';
  }, [session]);

  if (!user) {
    return <PortalLayout><div>Loading...</div></PortalLayout>;
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error("Ukuran file terlalu besar. Maksimal 2MB.");
        return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
        setImageToCrop(reader.result as string);
    });
    reader.readAsDataURL(file);
    
    event.target.value = '';
  };

  const handleAvatarUpload = async (imageBlob: Blob) => {
    setImageToCrop(null);
    if (!imageBlob) return;

    setIsUploading(true);
    try {
        const fileExt = 'png';
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        if (user.avatar_url && !user.avatar_url.includes('dicebear.com')) {
            try {
                const oldAvatarPath = new URL(user.avatar_url).pathname.split('/avatars/')[1];
                if (oldAvatarPath) {
                    await supabase.storage.from('avatars').remove([oldAvatarPath]);
                }
            } catch (e) {
                console.warn("Could not remove old avatar.", e);
            }
        }

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, imageBlob, { contentType: 'image/png', upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        if (!publicUrlData.publicUrl) {
            throw new Error("Could not get public URL for avatar.");
        }

        const avatar_url = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: avatar_url, updated_at: new Date().toISOString() })
            .eq('id', user.id);

        if (updateError) throw updateError;

        toast.success("Avatar berhasil diperbarui.");
        await refreshUser();
        queryClient.invalidateQueries({ queryKey: ['user', user.id] });

    } catch (error: any) {
        toast.error("Gagal mengunggah avatar.", { description: error.message });
        console.error(error);
    } finally {
        setIsUploading(false);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // This will trigger a database function to update the profiles table as well
      const { error: authError } = await supabase.auth.updateUser({
        data: { 
          first_name: firstName, 
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim()
        }
      });

      if (authError) throw authError;

      // Phone number is not in auth metadata, so update it separately in profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          phone: phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast.success("Profil berhasil diperbarui.");
      
      SafeLocalStorage.removeItem(`profile-form-firstName-${user.id}`);
      SafeLocalStorage.removeItem(`profile-form-lastName-${user.id}`);
      SafeLocalStorage.removeItem(`profile-form-phone-${user.id}`);

      await refreshUser();
    } catch (error: any) {
      toast.error("Gagal memperbarui profil.", { description: error.message });
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetChanges = () => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setPhone(user.phone || "");
      SafeLocalStorage.removeItem(`profile-form-firstName-${user.id}`);
      SafeLocalStorage.removeItem(`profile-form-lastName-${user.id}`);
      SafeLocalStorage.removeItem(`profile-form-phone-${user.id}`);
      toast.info("Changes have been discarded.");
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 8) {
      toast.error("Password minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }

    setIsPasswordUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        throw error;
      }
      toast.success("Password berhasil diperbarui.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      if (error.message.includes('New password should be different from the old password')) {
        toast.info("Password baru sama dengan password lama. Tidak ada perubahan yang dilakukan.");
      } else {
        toast.error("Gagal memperbarui password.", { description: error.message });
      }
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile & Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and profile information.
          </p>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details here.</CardDescription>
              </div>
              {user.role && (
                <Badge variant="outline" className="capitalize text-sm">
                  {user.role}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={getAvatarUrl(user.avatar_url, user.id)} alt={user.first_name || ''} />
                  <AvatarFallback style={generatePastelColor(user.id)}>{getInitials(user.first_name, user.email)}</AvatarFallback>
                </Avatar>
                <label 
                    htmlFor="avatar-upload" 
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    {isUploading ? (
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                        <Camera className="h-6 w-6 text-white" />
                    )}
                    <input 
                        id="avatar-upload" 
                        type="file" 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/gif"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                    />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (for WhatsApp)</Label>
                <PhoneNumberInput value={phone} onChange={setPhone} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleSaveChanges} disabled={isSaving || !hasUnsavedChanges}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleResetChanges} disabled={isSaving || !hasUnsavedChanges}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {canChangePassword ? (
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Update your password. It's recommended to use a strong, unique password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input id="new-password" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3" onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
               <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  <Button type="button" variant="ghost" size="icon" className="absolute inset-y-0 right-0 h-full px-3" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={handlePasswordChange} disabled={isPasswordUpdating}>
                {isPasswordUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You are signed in with a social provider (e.g., Google). You can manage your password through your provider's settings.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              These actions can have permanent consequences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
      {imageToCrop && (
        <AvatarCropper
          imageSrc={imageToCrop}
          onCropComplete={handleAvatarUpload}
          onClose={() => setImageToCrop(null)}
        />
      )}
    </PortalLayout>
  );
};

export default Profile;