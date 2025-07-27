import React from 'react';
import { 
  File, 
  FileText, 
  FileArchive, 
  FileAudio, 
  FileVideo, 
  FileSpreadsheet, 
  FileImage,
  FileCode,
  FileJson
} from 'lucide-react';

const getIconForFileType = (type: string): React.ElementType => {
  if (type.startsWith('image/')) return FileImage;
  if (type.startsWith('audio/')) return FileAudio;
  if (type.startsWith('video/')) return FileVideo;

  // Specific MIME types
  const fileTypeIcons: { [key: string]: React.ElementType } = {
    'application/pdf': FileText,
    'application/msword': FileText,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
    'text/plain': FileText,
    'application/vnd.ms-excel': FileSpreadsheet,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,
    'text/csv': FileSpreadsheet,
    'application/zip': FileArchive,
    'application/x-rar-compressed': FileArchive,
    'application/x-7z-compressed': FileArchive,
    'text/html': FileCode,
    'text/css': FileCode,
    'application/javascript': FileCode,
    'application/json': FileJson,
  };

  return fileTypeIcons[type] || File;
};

interface FileIconProps {
  fileType: string;
  className?: string;
}

const FileIcon: React.FC<FileIconProps> = ({ fileType, className }) => {
  const IconComponent = getIconForFileType(fileType);
  return <IconComponent className={className} />;
};

export default FileIcon;