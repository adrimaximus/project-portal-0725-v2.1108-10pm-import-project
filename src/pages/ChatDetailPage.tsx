import PortalLayout from '@/components/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useParams } from 'react-router-dom';

const ChatDetailPage = () => {
  const { chatId } = useParams();
  return (
    <PortalLayout>
      <Card>
        <CardHeader>
          <CardTitle>Chat Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Details for chat ID: {chatId}. Content will be added soon.</p>
        </CardContent>
      </Card>
    </PortalLayout>
  );
};

export default ChatDetailPage;