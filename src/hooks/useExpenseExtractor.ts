import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ExtractedData {
  amount: number;
  purpose: string;
  beneficiary: string;
  remarks: string;
}

interface FileMetadata {
  name: string;
  url: string;
  size: number;
  type: string;
  storagePath: string;
}

const SUPABASE_URL = "https://quuecudndfztjlxbrvyb.supabase.co";
const FUNCTION_NAME = "extract-expense-data";

export const useExpenseExtractor = () => {
  const [isExtracting, setIsExtracting] = useState(false);

  const extractData = useCallback(async (file: FileMetadata): Promise<ExtractedData | null> => {
    setIsExtracting(true);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileUrl: file.url, fileName: file.name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract data from document.');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        toast.success("AI extracted data successfully.");
        return result.data as ExtractedData;
      } else {
        throw new Error("AI extraction failed or returned empty data.");
      }

    } catch (error: any) {
      console.error("Extraction error:", error);
      toast.error("AI Extraction Failed", { description: error.message });
      return null;
    } finally {
      setIsExtracting(false);
    }
  }, []);

  return { extractData, isExtracting };
};