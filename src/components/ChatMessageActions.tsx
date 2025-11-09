import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button"
import { MoreHorizontal, Reply, Pencil, Copy, Trash2, Share2 } from "lucide-react"
import { Message } from "@/types"
import { useChatContext } from "@/contexts/ChatContext"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity", className)}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
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