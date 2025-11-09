import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trash2, Download, Upload, HardDrive, AlertTriangle } from 'lucide-react';
import SafeLocalStorage from '@/lib/localStorage';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const StorageManagementCard = () => {
  const [storageInfo, setStorageInfo] = useState({
    used: 0,
    available: 0,
    total: 0,
    items: 0,
  });
  const [storageKeys, setStorageKeys] = useState<string[]>([]);

  const refreshStorageInfo = () => {
    const info = SafeLocalStorage.getStorageInfo();
    setStorageInfo(info);
    const data = SafeLocalStorage.exportData();
    setStorageKeys(Object.keys(data));
  };

  useEffect(() => {
    refreshStorageInfo();
  }, []);

  const handleCleanup = () => {
    const cleanedCount = SafeLocalStorage.cleanup();
    toast.success(`Cleaned up ${cleanedCount} expired items`);
    refreshStorageInfo();
  };

  const handleClearAll = () => {
    SafeLocalStorage.clear();
    toast.success('All local storage data cleared');
    refreshStorageInfo();
    // Refresh page to reset app state
    window.location.reload();
  };

  const handleExportData = () => {
    const data = SafeLocalStorage.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `localStorage-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Local storage data exported');
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const success = SafeLocalStorage.importData(data);
        if (success) {
          toast.success('Local storage data imported successfully');
          refreshStorageInfo();
        } else {
          toast.error('Failed to import data');
        }
      } catch (error) {
        toast.error('Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  const usedPercentage = storageInfo.total > 0 ? (storageInfo.used / storageInfo.total) * 100 : 0;
  const isNearLimit = usedPercentage > 80;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Local Storage Management
            </CardTitle>
            <CardDescription>
              Manage your browser's local storage data and preferences.
            </CardDescription>
          </div>
          {isNearLimit && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Near Limit
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Storage Usage */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Storage Usage</span>
            <span>{formatBytes(storageInfo.used)} / {formatBytes(storageInfo.total)}</span>
          </div>
          <Progress 
            value={usedPercentage} 
            className={`h-2 ${isNearLimit ? '[&>div]:bg-red-500' : ''}`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help underline decoration-dotted">{storageInfo.items} items stored</span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-h-48 overflow-y-auto p-1">
                    <p className="font-semibold mb-2">Stored Keys:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      {storageKeys.length > 0 ? (
                        storageKeys.map(key => (
                          <li key={key} className="truncate">{key}</li>
                        ))
                      ) : (
                        <li>No items found.</li>
                      )}
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span>{usedPercentage.toFixed(1)}% used</span>
          </div>
        </div>

        {/* Storage Items Breakdown */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Stored Preferences</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Theme:</span>
              <Badge variant="outline">{SafeLocalStorage.getItem('vite-ui-theme', 'system')}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Goals View:</span>
              <Badge variant="outline">{SafeLocalStorage.getItem('goals_view_mode', 'card')}</Badge>
            </div>
            <div className="flex justify-between">
              <span>People View:</span>
              <Badge variant="outline">{SafeLocalStorage.getItem('people_view_mode', 'grid')}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Hide Completed:</span>
              <Badge variant="outline">{SafeLocalStorage.getItem('hideCompletedTasks', false) ? 'Yes' : 'No'}</Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleCleanup}>
            <Trash2 className="mr-2 h-4 w-4" />
            Cleanup Expired
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <label htmlFor="import-storage" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              Import Data
              <input
                id="import-storage"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportData}
              />
            </label>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear All Local Storage?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all your saved preferences and settings. The page will reload to reset the application state. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll}>
                  Clear All Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Warning for near limit */}
        {isNearLimit && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Storage Nearly Full</span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Consider cleaning up expired data or clearing unused preferences to free up space.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StorageManagementCard;