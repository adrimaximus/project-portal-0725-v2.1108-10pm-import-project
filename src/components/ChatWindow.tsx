import { Conversation } from "@/data/chat";
import ChatHeader from "./ChatHeader";
import ChatConversation from "./ChatConversation";
import ChatInput from "./ChatInput";
import { Project } from "@/data/projects";

interface ChatWindowProps {
  selectedConversation: Conversation | undefined;
  onSendMessage: (message: string, file?: File) => void;
  projects: Project[];
  onBack?: () => void;
}

const ChatWindow = ({ selectedConversation, onSendMessage, projects, onBack }: ChatWindowProps) => {
  if (!selectedConversation) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-muted/40">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Welcome to Chat</h2>
          <p className="text-muted-foreground">
            Select a conversation to start messaging.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader selectedConversation={selectedConversation} onBack={onBack} />
      <ChatConversation 
        messages={selectedConversation.messages} 
        members={selectedConversation.members}
        projects={projects}
      />
      <ChatInput 
        onSendMessage={onSendMessage} 
        members={selectedConversation.isGroup ? selectedConversation.members : []}
        projects={projects}
      />
    </div>
  );
};

export default ChatWindow;