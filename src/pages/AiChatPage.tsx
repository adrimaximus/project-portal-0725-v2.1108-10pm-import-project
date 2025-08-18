import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function AiChatPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q");

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-primary" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground mb-2">You asked:</p>
            <p className="text-lg font-medium">{query}</p>
          </div>
          <div className="mt-6 pt-6">
            <p className="text-center text-muted-foreground">AI response will appear here...</p>
            {/* Placeholder for AI response component */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}