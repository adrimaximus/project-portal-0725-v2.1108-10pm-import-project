import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const useExpenseExtractor = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const navigate = useNavigate();

  const extractData = async (file: { url: string; type: string }) => {
    if (!file?.url) {
        toast.error("Invalid file URL");
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
        console.error('Edge Function Error:', error);
        
        // Handle custom 422 error for missing configuration
        if (error.context && typeof error.context.json === 'function') {
           const body = await error.context.json().catch(() => ({}));
           if (body.error && body.error.includes("OpenAI API Key is not configured")) {
             toast.error("OpenAI Integration Missing", {
               description: "Please configure OpenAI in settings to use this feature.",
               action: {
                 label: "Go to Settings",
                 onClick: () => navigate("/settings/integrations/openai")
               }
             });
             throw new Error(body.error);
           }
        }

        const msg = error.message || 'Failed to analyze document';
        throw new Error(msg);
      }

      console.log('Extraction success:', data);
      return data;
    } catch (error: any) {
      console.error('Extraction failed:', error);
      // Only show toast if it wasn't the specific config error handled above
      if (!error.message.includes("OpenAI API Key is not configured")) {
         toast.error("Analysis Failed", { description: error.message });
      }
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  return { extractData, isExtracting };
};