import PortalLayout from '@/components/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProfilePage = () => {
  return (
    <PortalLayout>
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is the profile page. Content will be added soon.</p>
        </CardContent>
      </Card>
    </PortalLayout>
  );
};

export default ProfilePage;