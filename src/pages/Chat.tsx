import { useParams } from 'react-router-dom';
import PortalLayout from '@/components/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Chat = () => {
  const { id } = useParams();
  return (
    <PortalLayout>
      <Card>
        <CardHeader>
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Opening chat with user ID: <strong>{id}</strong></p>
          <p className="mt-4 text-muted-foreground">This is a placeholder page. A full chat interface would be implemented here.</p>
        </CardContent>
      </Card>
    </PortalLayout>
  );
};

export default Chat;