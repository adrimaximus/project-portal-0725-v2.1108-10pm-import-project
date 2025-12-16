import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExtractedExpenseData {
  amount?: number;
  beneficiary?: string;
  purpose?: string;
  remarks?: string;
  date?: string;
}

export const useExpenseExtractor = () => {
  const [isExtracting, setIsExtracting] = useState(false);

  const extractData = async (file: { url: string; type: string; name: string }): Promise<ExtractedExpenseData | null> => {
    // Only process images for now as GPT-4o vision requires images
    if (!file.type.startsWith('image/')) {
      return null;
    }

    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-document', {
        body: { 
          fileUrl: file.url,
          fileType: file.type,
          fileName: file.name
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error('Failed to connect to analysis service');
      }

      if (data?.error) {
        console.error('Analysis error:', data.error);
        throw new Error(data.error);
      }

      console.log('AI Extraction result:', data);
      
      if (!data || Object.keys(data).length === 0) {
        return null;
      }

      return data as ExtractedExpenseData;
    } catch (error: any) {
      console.error('Error extracting data:', error);
      toast.error('Failed to analyze document', { description: error.message });
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  return { extractData, isExtracting };
};