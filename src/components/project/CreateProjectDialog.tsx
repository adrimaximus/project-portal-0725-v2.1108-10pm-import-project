import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';

export const CreateProjectDialog = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) {
      toast.error('Nama proyek wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from('projects').insert({
      name,
      category,
      description,
      created_by: user.id,
      status: 'Requested',
      payment_status: 'Proposed'
    });

    setIsSubmitting(false);

    if (error) {
      toast.error('Gagal membuat proyek', { description: error.message });
    } else {
      toast.success('Proyek berhasil dibuat!');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setOpen(false);
      // Reset form
      setName('');
      setCategory('');
      setDescription('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Proyek Baru
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buat Proyek Baru</DialogTitle>
          <DialogDescription>
            Isi detail di bawah ini untuk membuat proyek baru.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} id="create-project-form">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nama
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="cth. Desain Ulang Situs Web"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Kategori
              </Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="col-span-3"
                placeholder="cth. Pengembangan Web"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Deskripsi
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Jelaskan proyek secara singkat."
              />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Batal</Button>
          <Button type="submit" form="create-project-form" disabled={isSubmitting}>
            {isSubmitting ? 'Membuat...' : 'Buat Proyek'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};