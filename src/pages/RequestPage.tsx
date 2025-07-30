import PortalLayout from '@/components/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RequestPage = () => {
  return (
    <PortalLayout>
      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is the request page. Content will be added soon.</p>
        </CardContent>
      </Card>
    </PortalLayout>
  );
};

export default RequestPage;