import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoodHistoryEntry } from '@/data/mood';
import MonthHistorySection from './MonthHistorySection';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MoodHistoryProps {
  history: MoodHistoryEntry[];
}

const MoodHistory = ({ history }: MoodHistoryProps) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Filter riwayat untuk hanya menyertakan entri dari tahun yang dipilih
  const yearHistory = history.filter(entry => {
    // Menambahkan 'T00:00:00Z' untuk memperlakukan string tanggal sebagai UTC
    const entryDate = new Date(entry.date + 'T00:00:00Z');
    return entryDate.getUTCFullYear() === selectedYear;
  });

  // Kelompokkan riwayat tahun berdasarkan indeks bulan (0-11)
  const groupedByMonth = yearHistory.reduce((acc, entry) => {
    const entryDate = new Date(entry.date + 'T00:00:00Z');
    const monthIndex = entryDate.getUTCMonth();
    
    if (!acc[monthIndex]) {
      acc[monthIndex] = [];
    }
    acc[monthIndex].push(entry);
    return acc;
  }, {} as Record<number, MoodHistoryEntry[]>);

  // Buat daftar 12 bulan untuk tahun yang dipilih
  const monthsOfYear = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(selectedYear, i, 1);
    // Menggunakan lokal 'id-ID' untuk nama bulan
    const monthName = monthDate.toLocaleString('id-ID', { month: 'long' });
    return {
      // MonthHistorySection mengharapkan string seperti "Januari 2024"
      name: `${monthName} ${selectedYear}`,
      entries: groupedByMonth[i] || []
    };
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Riwayat Mood</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setSelectedYear(y => y - 1)}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Tahun Sebelumnya</span>
          </Button>
          <span className="font-semibold text-lg tabular-nums">{selectedYear}</span>
          <Button variant="outline" size="icon" onClick={() => setSelectedYear(y => y + 1)}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Tahun Berikutnya</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {monthsOfYear.map(monthData => (
            <MonthHistorySection key={monthData.name} month={monthData.name} entries={monthData.entries} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodHistory;