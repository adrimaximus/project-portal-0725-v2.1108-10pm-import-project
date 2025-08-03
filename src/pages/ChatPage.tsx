import PortalLayout from "@/components/PortalLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { dummyProjects } from "@/data/projects";
import { Link } from "react-router-dom";

const ChatPage = () => {
  return (
    <PortalLayout>
      <div className="grid grid-cols-4 h-[calc(100vh-4rem)]">
        <div className="col-span-1 border-r p-4">
          <h2 className="text-xl font-bold mb-4">Projects</h2>
          <ul className="space-y-2">
            {dummyProjects.map(p => (
              <li key={p.id}>
                <Link to="#" className="block p-2 rounded-md hover:bg-muted">{p.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-span-3 flex flex-col">
          <div className="flex-1 p-6 space-y-4 overflow-y-auto">
            {/* Chat messages would go here */}
            <p className="text-center text-muted-foreground">Select a project to start chatting.</p>
          </div>
          <div className="p-4 border-t">
            <div className="relative">
              <Input placeholder="Type a message..." className="pr-16" />
              <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};

export default ChatPage;