interface Props { isOpen: boolean; onClose: () => void; onSuccess: () => void; }
export const CreateProjectDialog = ({ isOpen, onClose }: Props) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '2rem', border: '1px solid black', zIndex: 100 }}>
      <h2>Buat Proyek Baru</h2>
      <p>Konten dialog ada di sini.</p>
      <button onClick={onClose}>Tutup</button>
    </div>
  );
};