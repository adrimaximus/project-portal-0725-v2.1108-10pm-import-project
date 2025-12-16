import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useExpenseExtractor = () => {
  const [isExtracting, setIsExtracting] = useState(false);

  const extractData = async (file: { url: string }) => {
    if (!file?.url) {
        toast.error("Invalid file URL");
        return null;
    }

    setIsExtracting(true);
    try {
      console.log('Sending extraction request for:', file.url);
      
      const { data, error } = await supabase.functions.invoke('extract-expense-data', {
        body: { fileUrl: file.url },
      });

      if (error) {
        console.error('Edge Function Error:', error);
        // Better error message for user
        const msg = error.message?.includes('500') 
            ? 'Server error during extraction. Please check system logs.' 
            : (error.message || 'Failed to analyze document');
        throw new Error(msg);
      }

      console.log('Extraction success:', data);
      return data;
    } catch (error: any) {
      console.error('Extraction failed:', error);
      toast.error(error.message || 'Failed to extract data');
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  return { extractData, isExtracting };
};