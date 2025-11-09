import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button"
import { MoreHorizontal, Reply, Pencil, Copy, Trash2, Share2, Smile } from "lucide-react"
import { Message } from "@/types"
import { useChatContext } from "@/contexts/ChatContext"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { supabase } from "@/integrations/supabase/client"

interface ChatMessageActionsProps {
  message: Message
  isCurrentUser: boolean
  onReply?: (message: Message) => void
  className?: string
}

export function ChatMessageActions({ message, isCurrentUser, onReply, className }: ChatMessageActionsProps) {
  const { setEditingMessage, openForwardDialog, deleteMessage } = useChatContext()

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text)
      toast.success("Message copied to clipboard")
    }
  }

  const handleReact = async (emoji: string) => {
    const { error } = await supabase.rpc('toggle_message_reaction', {
      p_message_id: message.id,
      p_emoji: emoji,
    })

    if (error) {
      toast.error("Failed to react to message")
      console.error(error)
    }
  }

  const commonReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mr-2.5", className)}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Smile className="mr-2 h-4 w-4" />
            <span>React</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <div className="flex p-1">
                {commonReactions.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-8 w-8 text-xl"
                    onClick={() => handleReact(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        {onReply && (
          <DropdownMenuItem onClick={() => onReply(message)}>
            <Reply className="mr-2 h-4 w-4" />
            <span>Reply</span>
          </DropdownMenuItem>
        )}
        {message.text && (
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => openForwardDialog(message)}>
          <Share2 className="mr-2 h-4 w-4" />
          <span>Forward</span>
        </DropdownMenuItem>
        {isCurrentUser && (
          <>
            {message.text && (
              <DropdownMenuItem onClick={() => setEditingMessage(message)}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-destructive" onClick={() => deleteMessage(message.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}