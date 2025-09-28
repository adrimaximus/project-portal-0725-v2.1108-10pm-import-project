import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import useStorageHealth from '@/hooks/useStorageHealth';

const StorageWarning = () => {
  const { health, performCleanup } = useStorageHealth();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Reset dismissal when health changes significantly
    if (health.usagePercentage < 70) {
      setIsDismissed(false);
    }
  }, [health.usagePercentage]);

  // Don't show if dismissed or healthy
  if (isDismissed || health.isHealthy || health.usagePercentage < 80) {
    return null;
  }

  const handleQuickCleanup = () => {
    const cleanedCount = performCleanup();
    if (cleanedCount === 0) {
      setIsDismissed(true);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Alert variant="destructive" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          <div className="flex justify-between items-start mb-2">
            <span className="font-medium">Storage Nearly Full</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 text-yellow-600 hover:text-yellow-800"
              onClick={() => setIsDismissed(true)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs mb-3">
            Your browser storage is {health.usagePercentage.toFixed(1)}% full. 
            This may affect app performance.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleQuickCleanup}
              className="text-xs h-7"
            >
              Quick Cleanup
            </Button>
            <Button
              size="sm"
              variant="outline"
              asChild
              className="text-xs h-7"
            >
              <Link to="/settings/storage">
                <Settings className="mr-1 h-3 w-3" />
                Manage
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default StorageWarning;