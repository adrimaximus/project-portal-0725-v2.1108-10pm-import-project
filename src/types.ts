export interface Collaborator {
  id: string;
  name: string;
  email: string;
  // Digunakan untuk komponen Avatar
  src: string;      // URL gambar
  fallback: string; // Teks fallback (misal: inisial)
  online?: boolean; // Status online untuk obrolan
}