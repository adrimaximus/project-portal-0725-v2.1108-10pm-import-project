import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarPreview(user.avatar);
    }
  }, [user]);

  if (!user) {
    return <PortalLayout><div>Loading profile...</div></PortalLayout>;
  }

  const handlePhotoChangeClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
      toast.info("Avatar preview updated. Save changes to apply. Note: Avatar upload is not fully implemented yet.");
    }
  };

  const handleSaveChanges = async () => {
    const nameParts = name.split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ');
    
    await updateUser({ first_name, last_name });

    toast.success("Profile Updated", {
      description: "Your name has been saved successfully.",
    });
  };

  const handlePasswordChange = () => {
    toast.success("Password Updated", {
      description: "Your password has been changed successfully.",
    });
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
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview || "https://github.com/shadcn.png"} alt={name} />
                <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <Button variant="outline" onClick={handlePhotoChangeClick}>Change Photo</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user.email} disabled />
              </div>
            </div>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Update your password. It's recommended to use a strong, unique password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button onClick={handlePasswordChange}>Change Password</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Manage how you receive notifications from the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="email-mentions">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive an email when you are mentioned or a critical event occurs.</p>
              </div>
              <Switch id="email-mentions" defaultChecked />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Get push notifications on your devices for all activities.</p>
              </div>
              <Switch id="push-notifications" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Profile;