import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PERMISSIONS } from '@/data/permissions';
import { ScrollArea } from '../ui/scroll-area';
import { toast } from 'sonner';
import { FeatureFlag } from '@/contexts/FeaturesContext';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type Role = {
  id?: string;
  name: string;
  description: string;
  permissions: string[];
  is_predefined?: boolean;
};

interface RoleManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (role: Role) => void;
  role?: Role | null;
  workspaceFeatures: FeatureFlag[];
}

const RoleManagerDialog = ({ open, onOpenChange, onSave, role, workspaceFeatures }: RoleManagerDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);

  const isEditMode = !!role;

  useEffect(() => {
    if (open && role) {
      setName(role.name);
      setDescription(role.description || '');
      setPermissions(role.permissions || []);
    } else if (open) {
      setName('');
      setDescription('');
      const modulePermissions = PERMISSIONS.find(cat => cat.id === 'modules')?.permissions.map(p => p.id) || [];
      setPermissions(modulePermissions);
    }
  }, [role, open]);

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setPermissions(prev => [...prev, permissionId]);
    } else {
      setPermissions(prev => prev.filter(p => p !== permissionId));
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Role name cannot be empty.");
      return;
    }
    onSave({ ...role, name, description, permissions });
  };

  const isModuleEnabled = (permissionId: string) => {
    if (!permissionId.startsWith('module:')) {
      return true;
    }
    const featureId = permissionId.replace('module:', '');
    const feature = workspaceFeatures.find(f => f.id === featureId);
    return feature ? feature.is_enabled : false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          <DialogDescription>
            Define a role and select the permissions it should have.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <ScrollArea className="h-72 p-4 border rounded-md">
          <div className="space-y-6">
            {PERMISSIONS.map(category => (
              <div key={category.id}>
                <h4 className="font-semibold mb-3">{category.label}</h4>
                <div className="space-y-3">
                  {category.permissions.map(permission => {
                    const isEnabled = isModuleEnabled(permission.id);
                    const isDisabledModule = permission.id.startsWith('module:') && !isEnabled;
                    return (
                      <TooltipProvider key={permission.id} delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                id={permission.id}
                                checked={permissions.includes(permission.id)}
                                onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                                disabled={!isEnabled}
                              />
                              <div className="grid gap-1.5 leading-none">
                                <label
                                  htmlFor={permission.id}
                                  className={cn(
                                    "text-sm font-medium leading-none",
                                    !isEnabled ? "cursor-not-allowed opacity-50" : "peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  )}
                                >
                                  {permission.label}
                                </label>
                                <p className="text-sm text-muted-foreground">
                                  {permission.description}
                                  {permission.id.startsWith('module:') && ' When unchecked, users with this role will not see this module in the navigation.'}
                                </p>
                              </div>
                            </div>
                          </TooltipTrigger>
                          {isDisabledModule && (
                            <TooltipContent>
                              <p>This module is currently disabled in your workspace settings.</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Save Role</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoleManagerDialog;