import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { generatePastelColor } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "./ui/button";
import { MoreHorizontal, Reply } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { EmojiReactionPicker } from "./EmojiReactionPicker";
import { useChatContext } from "@/contexts/ChatContext";

// Placeholder for MessageReactions as its implementation is unknown
const MessageReactions = ({ reactions }: { reactions: any[] }) => {
    if (!reactions || reactions.length === 0) return null;
    return <div className="text-xs">Reactions...</div>
}

interface ChatConversationProps {
    messages: Message[];
}

const ChatConversation = ({ messages }: ChatConversationProps) => {
    const { user } = useAuth();
    const { setReplyTo } = useChatContext();

    if (!user) return null;

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => {
                const isMe = message.sender_id === user.id;
                const prevMessage = messages[index - 1];
                const showAvatar = !isMe && (!prevMessage || prevMessage.sender_id !== message.sender_id);

                return (
                    <div key={message.id} className={cn("flex items-start gap-3", isMe && "justify-end")}>
                        {!isMe && (
                            <div className="w-8 flex-shrink-0">
                                {showAvatar && message.sender && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={message.sender.avatar_url || undefined} />
                                        <AvatarFallback style={{ backgroundColor: generatePastelColor(message.sender.id) }}>
                                            {message.sender.name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        )}
                        <div className={cn("group relative max-w-xs md:max-w-md", isMe ? "order-1" : "order-2")}>
                            <div className={cn("px-3 py-2 rounded-lg", isMe ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                {!isMe && showAvatar && <p className="text-xs font-bold mb-1 text-primary">{message.sender?.name}</p>}
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                <p className="text-xs mt-1 text-right opacity-70">{format(new Date(message.created_at), 'HH:mm')}</p>
                            </div>
                            <MessageReactions reactions={[]} />
                             <div className="absolute top-0 right-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-background border rounded-full">
                                <EmojiReactionPicker onSelect={(emoji) => console.log(`Reacting with ${emoji} to message ${message.id}`)} />
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setReplyTo(message)}>
                                    <Reply className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem>Copy</DropdownMenuItem>
                                        <DropdownMenuItem>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ChatConversation;