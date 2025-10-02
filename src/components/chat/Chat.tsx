import { useState } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Chat = () => {
  const [message, setMessage] = useState('');

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Chats</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold">Shadcn</p>
              <p className="text-sm text-muted-foreground truncate">Hey, how's it going?</p>
            </div>
            <span className="text-xs text-muted-foreground">2:45 PM</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="p-4 border-b flex items-center gap-3">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">Shadcn</p>
            <p className="text-sm text-muted-foreground">Online</p>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg p-3 max-w-xs">
              <p>Hey, how's it going?</p>
            </div>
          </div>
          <div className="flex items-start gap-3 justify-end">
            <div className="bg-primary text-primary-foreground rounded-lg p-3 max-w-xs">
              <p>Pretty good, thanks! How about you?</p>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://github.com/dyad.png" alt="@dyad" />
              <AvatarFallback>DY</AvatarFallback>
            </Avatar>
          </div>
        </div>

        <footer className="p-4 border-t">
          <div className="relative">
            <Input
              placeholder="Type a message..."
              className="pr-28"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-1">
              <Button variant="ghost" size="icon">
                <Smile className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button size="icon">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Chat;