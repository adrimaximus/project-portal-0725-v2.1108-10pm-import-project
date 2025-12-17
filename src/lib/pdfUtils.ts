import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist';

// Configure the worker source using unpkg to match the installed version
// We use a CDN because creating a local worker bundle in this environment can be complex
GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.js`;

export const convertPdfToImage = async (file: File): Promise<File | null> => {
    try {
        console.log(`Starting PDF conversion for: ${file.name}`);
        const arrayBuffer = await file.arrayBuffer();
        
        // Load the PDF document
        const loadingTask = getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        console.log(`PDF loaded, pages: ${pdf.numPages}`);
        
        // Fetch the first page
        const page = await pdf.getPage(1);
        
        // Set scale for better quality (2.0 is usually good for OCR/analysis)
        const scale = 2.0;
        const viewport = page.getViewport({ scale });
        
        // Prepare canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
            console.error("Failed to get canvas context");
            return null;
        }
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };
        
        await page.render(renderContext).promise;
        
        // Convert canvas to blob/file
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    // Create a new filename replacing .pdf with .png
                    const newName = file.name.replace(/\.[^/.]+$/, "") + ".png";
                    console.log(`PDF converted successfully to: ${newName}`);
                    const imageFile = new File([blob], newName, { type: 'image/png' });
                    resolve(imageFile);
                } else {
                    console.error("Canvas to Blob conversion failed");
                    resolve(null);
                }
            }, 'image/png');
        });
    } catch (error) {
        console.error("PDF to Image conversion error:", error);
        return null;
    }
};