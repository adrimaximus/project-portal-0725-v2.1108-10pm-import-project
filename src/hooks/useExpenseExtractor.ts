import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const useExpenseExtractor = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const navigate = useNavigate();

  const extractData = async (file: { url: string; type: string }) => {
    if (!file?.url) {
        // Just return, don't error, might be a local file not yet uploaded
        return null;
    }

    // Skip extraction request entirely on client side if it's not an image
    // to save a server roundtrip, though server protection is still good.
    if (!file.type.startsWith('image/')) {
        toast.info("AI Analysis Skipped", { description: "Only image files (JPG/PNG) are analyzed for auto-fill. PDF stored successfully." });
        return null;
    }

    setIsExtracting(true);
    try {
      console.log('Sending extraction request for:', file.url);
      
      const { data, error } = await supabase.functions.invoke('extract-expense-data', {
        body: { 
          fileUrl: file.url,
          fileType: file.type 
        },
      });

      if (error) {
        // Handle custom errors passed from the function
        let errorMessage = error.message;
        
        if (error.context && typeof error.context.json === 'function') {
           const body = await error.context.json().catch(() => ({}));
           if (body.error) {
             errorMessage = body.error;
           }
        }

        if (errorMessage.includes("OpenAI API Key is not configured")) {
             toast.error("OpenAI Integration Missing", {
               description: "Please configure OpenAI in settings to use this feature.",
               action: {
                 label: "Go to Settings",
                 onClick: () => navigate("/settings/integrations/openai")
               }
             });
             return null;
        }

        // Don't throw for 422 (unsupported type), just warn
        if (errorMessage.includes("PDFs cannot be analyzed")) {
            toast.info("Analysis Skipped", { description: errorMessage });
            return null;
        }

        throw new Error(errorMessage);
      }

      console.log('Extraction success:', data);
      return data;
    } catch (error: any) {
      console.error('Extraction failed:', error);
      toast.error("Analysis Failed", { description: error.message });
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  return { extractData, isExtracting };
};