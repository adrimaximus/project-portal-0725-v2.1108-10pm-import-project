import { AlertTriangle } from 'lucide-react';

interface BrowserWarningsProps {
  isArcBrowser: boolean;
  error: string;
}

const BrowserWarnings = ({ isArcBrowser, error }: BrowserWarningsProps) => {
  return (
    <>
      {/* Arc Browser Warning */}
      {isArcBrowser && (
        <div className="mb-4 p-3 bg-orange-500/20 rounded text-orange-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-semibold">Arc Browser Detected</span>
          </div>
          <p className="mt-1">Arc browser may block authentication cookies. If login fails, try the Arc Browser Fix below.</p>
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 rounded text-red-200 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-semibold">Login Error</span>
          </div>
          <p className="mt-1">{error}</p>
        </div>
      )}
    </>
  );
};

export default BrowserWarnings;