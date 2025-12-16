import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExtractedExpenseData {
  amount?: number;
  beneficiary?: string;
  client_name?: string;
  location?: string;
  purpose?: string;
  remarks?: string;
  date?: string;
  due_date?: string;
  bank_details?: {
    bank_name?: string;
    account_number?: string;
    account_name?: string;
    swift_code?: string;
  } | null;
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
      const { data, error } = await supabase.functions.invoke('extract-expense-data', {
        body: { 
          fileUrl: file.url,
          fileType: file.type,
          fileName: file.name
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        // Try to read error body if available
        let errorMessage = 'Failed to connect to analysis service';
        try {
          // Sometimes error is a blob or object with message
          if (error instanceof Error) errorMessage = error.message;
          else if (typeof error === 'object' && error !== null && 'message' in error) errorMessage = (error as any).message;
        } catch (e) {}
        
        throw new Error(errorMessage);
      }

      if (data?.error) {
        console.error('Analysis error:', data.error);
        throw new Error(data.error);
      }

      console.log('AI Extraction result:', data);
      
      if (!data?.data || Object.keys(data.data).length === 0) {
        return null;
      }

      return data.data as ExtractedExpenseData;
    } catch (error: any) {
      console.error('Error extracting data:', error);
      toast.error('Failed to analyze document', { 
        description: error.message || "Please ensure OpenAI API Key is configured in Settings." 
      });
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  return { extractData, isExtracting };
};