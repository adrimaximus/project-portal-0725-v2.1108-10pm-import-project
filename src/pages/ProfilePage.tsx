import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ProfilePage = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <p>The content for the user's profile will go here.</p>
      </CardContent>
    </Card>
  );
};

export default ProfilePage;