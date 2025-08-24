import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export type DiagnosticStep = {
  step: string;
  status: 'pending' | 'success' | 'error';
  details?: string;
};

interface GoogleConnectionStatusProps {
  steps: DiagnosticStep[];
  onRun: () => void;
}

const StatusIcon = ({ status }: { status: DiagnosticStep['status'] }) => {
  if (status === 'pending') return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (status === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (status === 'error') return <XCircle className="h-4 w-4 text-red-500" />;
  return null;
};

const GoogleConnectionStatus = ({ steps, onRun }: GoogleConnectionStatusProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Connection Diagnostics</CardTitle>
        <Button variant="ghost" size="sm" onClick={onRun}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Re-run
        </Button>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="mt-1">
                <StatusIcon status={step.status} />
              </div>
              <div>
                <p className={cn("font-medium text-sm", step.status === 'error' && 'text-destructive')}>
                  {step.step}
                </p>
                {step.details && (
                  <p className="text-xs text-muted-foreground">{step.details}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default GoogleConnectionStatus;