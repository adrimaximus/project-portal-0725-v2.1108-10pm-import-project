import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Invoice {
  id: string;
  project_id: string;
  project_name: string;
  project_slug: string;
  amount: number;
  invoice_number: string | null;
  payment_status: string;
  payment_due_date: string | null;
  client_company_name: string | null;
}

export const useInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('get_all_invoices');

      if (error) {
        toast.error('Failed to fetch invoices.');
        console.error('Error fetching invoices:', error);
      } else {
        setInvoices((data as Invoice[]) || []);
      }
      setIsLoading(false);
    };

    fetchInvoices();
  }, []);

  return { invoices, isLoading };
};