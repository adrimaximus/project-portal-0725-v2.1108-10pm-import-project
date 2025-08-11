import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatList from "@/components/ChatList";
import ChatWindow from "@/components/ChatWindow";
import PortalLayout from "@/components/PortalLayout";
import { Collaborator } from "@/types";
import { supabase } from "@/integrations/supabase/client";

const ChatPage = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleInitialSelection = async () => {
      const collaborator = location.state?.selectedCollaborator as Collaborator | undefined;
      if (collaborator) {
        // Hapus state agar tidak terpanggil lagi saat navigasi
        navigate(location.pathname, { replace: true }); 
        
        const { data: conversationId, error } = await supabase.rpc('create_or_get_conversation', {
          p_other_user_id: collaborator.id,
          p_is_group: false,
        });

        if (error) {
          console.error("Error creating/getting conversation:", error);
        } else {
          setSelectedConversationId(conversationId);
        }
      }
    };
    handleInitialSelection();
  }, [location.state, navigate]);

  return (
    <PortalLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        <div className="w-full sm:w-1/3 lg:w-1/4 max-w-sm">
          <ChatList
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
          />
        </div>
        <div className="flex-1 hidden sm:flex">
          <ChatWindow conversationId={selectedConversationId} />
        </div>
      </div>
    </PortalLayout>
  );
};

export default ChatPage;