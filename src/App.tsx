import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import ChatList from "@/components/ChatList";
import ChatArea from "@/components/ChatArea";
import { ChatProvider } from "@/contexts/ChatContext";
import { AuthProvider } from "@/contexts/AuthContext";

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <main className="h-screen bg-background text-foreground">
          <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
              <ChatList />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={75} minSize={60}>
              <ChatArea />
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;