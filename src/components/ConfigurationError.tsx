import { AlertTriangle, Package } from 'lucide-react';

const ConfigurationError = ({ missingKey }: { missingKey: string }) => {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-8 text-center shadow-lg">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-foreground">
          Kesalahan Konfigurasi Aplikasi
        </h1>
        <p className="mt-2 text-muted-foreground">
          Aplikasi tidak dapat dimulai karena variabel lingkungan penting tidak diatur.
        </p>
        <div className="mt-6 rounded-md bg-muted p-3 text-left">
          <p className="text-sm font-semibold">Variabel yang Hilang:</p>
          <p className="font-mono text-sm text-red-600">{missingKey}</p>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Silakan hubungi administrator Anda untuk mengkonfigurasi variabel ini di pengaturan hosting. Setelah ditambahkan, aplikasi perlu di-rebuild.
        </p>
        <div className="mt-6 border-t pt-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Package className="h-5 w-5" />
                <span className="text-sm font-semibold">Client Portal</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationError;