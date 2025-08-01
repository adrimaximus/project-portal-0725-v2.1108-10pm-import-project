import { dummyProjects } from '@/data/projects';
import PortalLayout from '@/components/PortalLayout';

const ChatPage = () => {
  // This is just a placeholder to fix the compile error
  console.log(dummyProjects);
  return (
    <PortalLayout>
      <h1>Chat</h1>
    </PortalLayout>
  );
};

export default ChatPage;