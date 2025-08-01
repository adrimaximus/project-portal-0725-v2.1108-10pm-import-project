import PortalLayout from "@/components/PortalLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const Chat = () => {
  return (
    <PortalLayout>
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is the chat page.</p>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
};

export default Chat;