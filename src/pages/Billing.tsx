import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Invoice } from '@/types';
import { getColumns } from '@/components/billing/columns';
import { DataTable } from '@/components/billing/DataTable';
import { Toaster } from "@/components/ui/sonner"

const BillingPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_all_invoices');
    
    if (error) {
      console.error('Error fetching invoices:', error);
      setError('Failed to fetch invoices.');
      setInvoices([]);
    } else {
      setInvoices(data as Invoice[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const columns = getColumns(fetchInvoices);

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Billing</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <DataTable columns={columns} data={invoices} />
      )}
      <Toaster />
    </div>
  );
};

export default BillingPage;