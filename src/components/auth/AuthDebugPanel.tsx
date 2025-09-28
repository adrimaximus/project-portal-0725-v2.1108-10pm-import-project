import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthDebugPanelProps {
  authContextLoading: boolean;
  session: any;
  forceRefreshCount: number;
  debugInfo: string;
  isArcBrowser: boolean;
  onForceRefresh: () => void;
  onArcBrowserFix: () => void;
  onShowDebugger: () => void;
  onShowAuthTest: () => void;
  onNavigateToDashboard: () => void;
}

const AuthDebugPanel = ({
  authContextLoading,
  session,
  forceRefreshCount,
  debugInfo,
  isArcBrowser,
  onForceRefresh,
  onArcBrowserFix,
  onShowDebugger,
  onShowAuthTest,
  onNavigateToDashboard,
}: AuthDebugPanelProps) => {
  return (
    <>
      {/* Debug info with force refresh */}
      <div className="mb-4 p-3 bg-yellow-500/20 rounded text-yellow-200 text-xs">
        <div className="flex justify-between items-center">
          <div>
            <div>Debug: Loading={String(authContextLoading)}, Session={String(!!session)}</div>
            <div>Environment: {window.location.hostname}</div>
            <div>Refresh Count: {forceRefreshCount}</div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onForceRefresh}
            className="text-yellow-200 border-yellow-200/50 hover:bg-yellow-200/10"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        {debugInfo && <div className="mt-2 whitespace-pre-wrap">{debugInfo}</div>}
      </div>

      {/* Enhanced debug section */}
      <div className="mt-4 space-y-2">
        {session && (
          <Button 
            variant="default" 
            size="sm" 
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={onNavigateToDashboard}
          >
            Go to Dashboard (Session Active)
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-white border-white/20 hover:bg-white/10"
          onClick={onForceRefresh}
        >
          <RefreshCw className="mr-2 h-3 w-3" />
          Force Refresh Session
        </Button>
        {isArcBrowser && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-orange-200 border-orange-200/50 hover:bg-orange-200/10"
            onClick={onArcBrowserFix}
          >
            <AlertTriangle className="mr-2 h-3 w-3" />
            Arc Browser Fix
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-white border-white/20 hover:bg-white/10"
          onClick={onShowAuthTest}
        >
          Run Auth Test
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-white border-white/20 hover:bg-white/10"
          onClick={onShowDebugger}
        >
          Open Full Debugger
        </Button>
      </div>
    </>
  );
};

export default AuthDebugPanel;