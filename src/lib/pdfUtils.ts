import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF worker with a reliable CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export const convertPdfToImage = async (file: File): Promise<File | null> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1); // Analyze first page
        const scale = 2.0; // Higher scale for better quality text recognition
        const viewport = page.getViewport({ scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return null;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: context, viewport }).promise;
        
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    // Create a new filename replacing .pdf with .png
                    const newName = file.name.replace(/\.[^/.]+$/, "") + ".png";
                    const imageFile = new File([blob], newName, { type: 'image/png' });
                    resolve(imageFile);
                } else {
                    resolve(null);
                }
            }, 'image/png');
        });
    } catch (error) {
        console.error("PDF to Image conversion error:", error);
        return null;
    }
};