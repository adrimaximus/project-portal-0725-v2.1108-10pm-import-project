import { File, FileText, Image, Video, Music, Archive, Code } from "lucide-react";

export const FileIcon = ({ fileName, className = "h-6 w-6 text-gray-500" }: { fileName: string, className?: string }) => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension || '')) {
        return <Image className={className} />;
    }
    if (['mp4', 'mov', 'avi', 'webm'].includes(extension || '')) {
        return <Video className={className} />;
    }
    if (['mp3', 'wav', 'ogg'].includes(extension || '')) {
        return <Music className={className} />;
    }
    if (['zip', 'rar', '7z', 'tar.gz'].includes(extension || '')) {
        return <Archive className={className} />;
    }
    if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'java'].includes(extension || '')) {
        return <Code className={className} />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xls', 'xlsx'].includes(extension || '')) {
        return <FileText className={className} />;
    }
    
    return <File className={className} />;
};