import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

type PaymentStatus = {
  id: string;
  name: string;
  color: string;
  position: number;
};

const fetchPaymentStatuses = async (): Promise<PaymentStatus[]> => {
  const { data, error } = await supabase
    .from('payment_statuses')
    .select('*')
    .order('position', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
};

const updatePaymentStatus = async (status: Partial<PaymentStatus> & { id: string }) => {
  const { data, error } = await supabase
    .from('payment_statuses')
    .update({ name: status.name, color: status.color })
    .eq('id', status.id)
    .select();
  if (error) throw new Error(error.message);
  return data;
};

const addPaymentStatus = async (status: { name: string; color: string; position: number }) => {
  const { data, error } = await supabase
    .from('payment_statuses')
    .insert(status)
    .select();
  if (error) throw new Error(error.message);
  return data;
};

const deletePaymentStatus = async (id: string) => {
  const { error } = await supabase
    .from('payment_statuses')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
};

const updatePositions = async (statuses: { id: string; position: number }[]) => {
    const { error } = await supabase.rpc('update_payment_status_positions', {
        status_updates: statuses,
    });
    if (error) throw error;
};

const PaymentStatusManager = () => {
  const queryClient = useQueryClient();
  const { data: statuses = [], isLoading } = useQuery<PaymentStatus[]>({
    queryKey: ['payment_statuses'],
    queryFn: fetchPaymentStatuses,
  });

  const [localStatuses, setLocalStatuses] = useState<PaymentStatus[]>([]);

  useEffect(() => {
    setLocalStatuses(statuses);
  }, [statuses]);

  const updateMutation = useMutation({
    mutationFn: updatePaymentStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_statuses'] });
      toast.success("Status updated successfully.");
    },
    onError: (error) => {
      toast.error(`Error updating status: ${error.message}`);
    },
  });

  const addMutation = useMutation({
    mutationFn: addPaymentStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_statuses'] });
      toast.success("Status added successfully.");
    },
    onError: (error) => {
      toast.error(`Error adding status: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePaymentStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_statuses'] });
      toast.success("Status deleted successfully.");
    },
    onError: (error) => {
      toast.error(`Error deleting status: ${error.message}`);
    },
  });

  const updatePositionsMutation = useMutation({
    mutationFn: updatePositions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_statuses'] });
      toast.success("Order updated.");
    },
    onError: (error) => {
      toast.error(`Error updating order: ${error.message}`);
    },
  });

  const handleAddStatus = () => {
    const newPosition = localStatuses.length > 0 ? Math.max(...localStatuses.map(s => s.position)) + 1 : 0;
    addMutation.mutate({ name: "New Status", color: "#94a3b8", position: newPosition });
  };

  const handleInputChange = (id: string, field: 'name' | 'color', value: string) => {
    setLocalStatuses(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleInputBlur = (id: string) => {
    const status = localStatuses.find(s => s.id === id);
    const originalStatus = statuses.find(s => s.id === id);
    if (status && (status.name !== originalStatus?.name || status.color !== originalStatus?.color)) {
      updateMutation.mutate(status);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(localStatuses);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedPositions = items.map((item, index) => ({
      ...item,
      position: index,
    }));
    
    setLocalStatuses(updatedPositions);
    updatePositionsMutation.mutate(updatedPositions.map(({ id, position }) => ({ id, position })));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Statuses</h1>
          <p className="text-muted-foreground">
            Define the stages of your payment process. Drag to reorder.
          </p>
        </div>
        <div className="mt-6 space-y-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="statuses">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {localStatuses.map((status, index) => (
                    <Draggable key={status.id} draggableId={status.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="flex items-center gap-2"
                        >
                          <div {...provided.dragHandleProps} className="cursor-grab p-1">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <Input
                            type="color"
                            value={status.color}
                            onChange={(e) => handleInputChange(status.id, 'color', e.target.value)}
                            onBlur={() => handleInputBlur(status.id)}
                            className="w-10 h-10 p-1 border-none cursor-pointer"
                          />
                          <Input
                            value={status.name}
                            onChange={(e) => handleInputChange(status.id, 'name', e.target.value)}
                            onBlur={() => handleInputBlur(status.id)}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(status.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <Button variant="outline" onClick={handleAddStatus} className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add Status
          </Button>
        </div>
    </div>
  );
};

export default PaymentStatusManager;