import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Chat = () => {
  return (
    <PortalLayout>
      <div className="p-4 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the chat page. Chat functionality will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Chat;