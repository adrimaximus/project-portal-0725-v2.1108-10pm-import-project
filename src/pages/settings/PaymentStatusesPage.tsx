import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PaymentStatus {
  id: string;
  name: string;
  color: string;
  position: number;
}

const PaymentStatusFormDialog = ({ open, onOpenChange, status, onSave, isSaving }: { open: boolean, onOpenChange: (open: boolean) => void, status: PaymentStatus | null, onSave: (data: { name: string, color: string }) => void, isSaving: boolean }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#94a3b8');

  useEffect(() => {
    if (status) {
      setName(status.name);
      setColor(status.color);
    } else {
      setName('');
      setColor('#94a3b8');
    }
  }, [status, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, color });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{status ? 'Edit' : 'New'} Payment Status</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">Color</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input id="color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 p-1" />
                <Input type="text" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const PaymentStatusesPage = () => {
  const [statuses, setStatuses] = useState<PaymentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<PaymentStatus | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchStatuses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_statuses')
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching statuses:', error);
      toast.error('Failed to fetch payment statuses.');
    } else {
      setStatuses(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this status? This might affect existing projects.')) {
      return;
    }
    const { error } = await supabase.from('payment_statuses').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete status.');
      console.error('Error deleting status:', error);
    } else {
      toast.success('Status deleted successfully.');
      fetchStatuses();
    }
  };

  const handleOpenDialog = (status: PaymentStatus | null = null) => {
    setEditingStatus(status);
    setIsDialogOpen(true);
  };

  const handleSave = async (statusData: { name: string, color: string }) => {
    setIsSaving(true);
    
    const upsertData = { ...statusData };

    const promise = editingStatus?.id
      ? supabase.from('payment_statuses').update(upsertData).eq('id', editingStatus.id)
      : supabase.from('payment_statuses').insert({ ...upsertData, position: statuses.length });

    const { error } = await promise;
    setIsSaving(false);

    if (error) {
      toast.error(`Failed to save status: ${error.message}`);
    } else {
      toast.success(`Status "${statusData.name}" saved.`);
      fetchStatuses();
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Statuses</h1>
          <p className="text-muted-foreground">Manage the different payment statuses for your projects.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Status
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Statuses</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : statuses.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No payment statuses created yet.</p>
              <Button variant="link" onClick={() => handleOpenDialog()}>Create your first status</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statuses.map((status) => (
                  <TableRow key={status.id}>
                    <TableCell className="font-medium flex items-center">
                      <span className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: status.color }}></span>
                      {status.name}
                    </TableCell>
                    <TableCell>{status.color}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(status)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(status.id)} className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PaymentStatusFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        status={editingStatus}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
};

export default PaymentStatusesPage;