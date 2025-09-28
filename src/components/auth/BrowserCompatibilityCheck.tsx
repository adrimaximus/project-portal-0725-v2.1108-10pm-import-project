import { useEffect, useState } from 'react';
import { useBrowserDetection } from '@/hooks/useBrowserDetection';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BrowserCompatibilityCheckProps {
  onDismiss?: () => void;
  showDetails?: boolean;
}

const BrowserCompatibilityCheck = ({ onDismiss, showDetails = false }: BrowserCompatibilityCheckProps) => {
  const { browserInfo, getCompatibilityWarnings, isCompatible } = useBrowserDetection();
  const [showFullCheck, setShowFullCheck] = useState(showDetails);
  const warnings = getCompatibilityWarnings();

  if (!showFullCheck && warnings.length === 0) {
    return null;
  }

  if (showFullCheck) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {isCompatible() ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              Browser Compatibility
            </CardTitle>
            {onDismiss && (
              <Button variant="ghost" size="icon" onClick={onDismiss}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Browser:</span>
                <span className="font-mono">
                  {browserInfo.isArc && 'Arc'}
                  {browserInfo.isChrome && 'Chrome'}
                  {browserInfo.isSafari && 'Safari'}
                  {browserInfo.isFirefox && 'Firefox'}
                  {browserInfo.isEdge && 'Edge'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cookies:</span>
                <span className={browserInfo.cookiesEnabled ? 'text-green-600' : 'text-red-600'}>
                  {browserInfo.cookiesEnabled ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Local Storage:</span>
                <span className={browserInfo.localStorageEnabled ? 'text-green-600' : 'text-red-600'}>
                  {browserInfo.localStorageEnabled ? '✓' : '✗'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Private Mode:</span>
                <span className={!browserInfo.isPrivateMode ? 'text-green-600' : 'text-red-600'}>
                  {!browserInfo.isPrivateMode ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Mobile:</span>
                <span>{browserInfo.isMobile ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span>Compatible:</span>
                <span className={isCompatible() ? 'text-green-600' : 'text-yellow-600'}>
                  {isCompatible() ? 'Yes' : 'Partial'}
                </span>
              </div>
            </div>
          </div>
          
          {warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Recommendations:</h4>
              <ul className="space-y-1 text-xs">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (warnings.length > 0) {
    return (
      <Alert className="mb-4 border-yellow-500/50 bg-yellow-500/10">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <AlertTitle className="text-yellow-200">Browser Compatibility Issues</AlertTitle>
        <AlertDescription className="text-yellow-200/80">
          <div className="space-y-1">
            {warnings.slice(0, 2).map((warning, index) => (
              <p key={index} className="text-xs">{warning}</p>
            ))}
            {warnings.length > 2 && (
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto text-yellow-200 underline"
                onClick={() => setShowFullCheck(true)}
              >
                Show {warnings.length - 2} more issues
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default BrowserCompatibilityCheck;