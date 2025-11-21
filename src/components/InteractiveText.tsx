import React from 'react';
import { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getInitials } from '@/lib/utils';

interface InteractiveTextProps {
  text: string;
  members?: User[];
}

const InteractiveText: React.FC<InteractiveTextProps> = ({ text, members = [] }) => {
  if (!text) return null;

  // Pertama, format tautan proyek seperti [Nama Proyek](id) menjadi hanya "Nama Proyek"
  // Gunakan negative lookbehind `(?<!@)` untuk menghindari pencocokan penyebutan pengguna seperti @[Nama Pengguna](id)
  const projectLinkRegex = /(?<!@)\[([^\]]+)\]\(([^)]+)\)/g;
  const textWithProjectsFormatted = text.replace(projectLinkRegex, '$1');

  // Kemudian, tangani penyebutan pengguna
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = textWithProjectsFormatted.split(mentionRegex);

  return (
    <>
      {parts.map((part, index) => {
        // `split` dengan grup penangkap menyertakan bagian yang ditangkap dalam array.
        // Polanya adalah [teks, namaTampilan, idPengguna, teks, ...]
        if (index % 3 === 1) {
          const displayName = part;
          const userId = parts[index + 1];
          const member = members.find(m => m.id === userId);
          return (
            <span key={index} className="bg-primary/10 text-primary font-semibold rounded px-1 py-0.5 inline-flex items-center gap-1">
              {member && (
                <Avatar className="h-4 w-4">
                  <AvatarImage src={member.avatar_url} />
                  <AvatarFallback className="text-[8px]">{getInitials(member.name || displayName)}</AvatarFallback>
                </Avatar>
              )}
              @{displayName}
            </span>
          );
        }
        // Ini adalah bagian idPengguna, yang sudah kita gunakan, jadi kita lewati.
        if (index % 3 === 2) {
          return null;
        }
        // Ini adalah bagian teks biasa.
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
};

export default InteractiveText;