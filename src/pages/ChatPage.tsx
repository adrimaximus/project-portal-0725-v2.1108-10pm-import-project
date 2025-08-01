import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { projects } from '@/data/projects';
import PortalLayout from '@/components/PortalLayout';

const ChatPage = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hey, how is the E-commerce project going?', sender: 'Alice' },
    { id: 2, text: 'Good! We are on track. Just pushed the latest updates.', sender: 'You' },
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, { id: Date.now(), text: newMessage, sender: 'You' }]);
      setNewMessage('');
    }
  };

  const project = projects[0]; // Example project for chat context

  return (
    <PortalLayout>
      <div className="h-full flex flex-col">
        <header className="p-4 border-b">
          <h1 className="text-xl font-bold">Chat - {project.name}</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-end gap-2 ${message.sender === 'You' ? 'justify-end' : ''}`}>
              {message.sender !== 'You' && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={project.createdBy.avatar} />
                  <AvatarFallback>{project.createdBy.initials}</AvatarFallback>
                </Avatar>
              )}
              <div className={`rounded-lg p-3 max-w-xs lg:max-w-md ${message.sender === 'You' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t">
          <Card>
            <CardContent className="p-2">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  className="flex-1"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-5 w-5 mr-2" />
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
};

export default ChatPage;