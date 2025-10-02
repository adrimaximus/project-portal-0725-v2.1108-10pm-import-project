export const PERMISSIONS = [
  {
    id: 'modules',
    label: 'Akses Modul',
    permissions: [
      { id: 'module:dashboard', label: 'Dasbor', description: 'Akses modul Dasbor.' },
      { id: 'module:projects', label: 'Proyek', description: 'Akses modul Proyek.' },
      { id: 'module:tasks', label: 'Tugas', description: 'Akses modul Tugas.' },
      { id: 'module:request', label: 'Permintaan', description: 'Akses modul Permintaan.' },
      { id: 'module:chat', label: 'Chat', description: 'Akses modul Chat.' },
      { id: 'module:mood-tracker', label: 'Mood Tracker', description: 'Akses modul Mood Tracker.' },
      { id: 'module:goals', label: 'Goals', description: 'Akses modul Goals.' },
      { id: 'module:billing', label: 'Tagihan', description: 'Akses modul Tagihan.' },
      { id: 'module:people', label: 'Orang', description: 'Akses modul Orang.' },
      { id: 'module:knowledge-base', label: 'Knowledge Base', description: 'Akses modul Knowledge Base.' },
      { id: 'module:settings', label: 'Pengaturan', description: 'Akses modul Pengaturan.' },
    ],
  },
  {
    id: 'projects',
    label: 'Proyek',
    permissions: [
      { id: 'projects:create', label: 'Buat Proyek', description: 'Izinkan pengguna untuk membuat proyek baru.' },
      { id: 'projects:delete', label: 'Hapus Proyek', description: 'Izinkan pengguna untuk menghapus proyek yang mereka miliki.' },
      { id: 'projects:edit', label: 'Edit Detail Proyek', description: 'Izinkan pengguna untuk mengedit detail proyek di mana mereka menjadi anggota.' },
      { id: 'projects:manage_members', label: 'Kelola Anggota Proyek', description: 'Izinkan pengguna untuk menambah atau menghapus anggota dari proyek yang mereka miliki.' },
      { id: 'projects:view_all', label: 'Lihat Semua Proyek', description: 'Izinkan pengguna untuk melihat semua proyek, bukan hanya yang mereka ikuti.' },
      { id: 'projects:view_value', label: 'Lihat Nilai Proyek', description: 'Izinkan pengguna untuk melihat budget/nilai proyek. Jika tidak dicentang, nilai akan disembunyikan.' },
    ],
  },
  {
    id: 'tasks',
    label: 'Tugas',
    permissions: [
      { id: 'tasks:create', label: 'Buat Tugas', description: 'Izinkan pengguna untuk membuat tugas baru di dalam proyek mereka.' },
      { id: 'tasks:delete', label: 'Hapus Tugas', description: 'Izinkan pengguna untuk menghapus tugas di dalam proyek mereka.' },
      { id: 'tasks:edit', label: 'Edit Tugas', description: 'Izinkan pengguna untuk mengedit tugas di dalam proyek mereka.' },
      { id: 'tasks:assign', label: 'Tugaskan Tugas', description: 'Izinkan pengguna untuk menugaskan tugas kepada anggota proyek lain.' },
    ],
  },
  {
    id: 'settings',
    label: 'Pengaturan',
    permissions: [
      { id: 'settings:access', label: 'Akses Pengaturan', description: 'Izinkan pengguna untuk mengakses halaman utama pengaturan.' },
      { id: 'settings:manage_workspace', label: 'Kelola Workspace', description: 'Izinkan pengguna untuk mengubah pengaturan tingkat workspace.' },
      { id: 'settings:manage_roles', label: 'Kelola Peran & Izin', description: 'Izinkan pengguna untuk membuat, mengedit, dan menghapus peran.' },
      { id: 'settings:manage_users', label: 'Kelola Pengguna', description: 'Izinkan pengguna untuk mengundang, menghapus, dan mengelola pengguna di workspace.' },
      { id: 'settings:manage_billing', label: 'Kelola Tagihan', description: 'Izinkan pengguna untuk mengakses dan mengelola informasi tagihan.' },
      { id: 'settings:manage_integrations', label: 'Kelola Integrasi', description: 'Izinkan pengguna untuk mengelola integrasi workspace.' },
    ],
  },
];