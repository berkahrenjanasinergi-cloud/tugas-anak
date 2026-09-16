import { History, Task, Reward } from '@/types';
import { formatDate } from '@/lib/utils';

interface HistoryProps {
  history: History[];
  tasks: Task[];
  rewards: Reward[];
  onFinishWeek: (kidName: 'miqa' | 'irgi') => void;
}

export default function HistoryView({ history, tasks, rewards, onFinishWeek }: HistoryProps) {
  const miqaHistory = history.filter(h => h.kid_name === 'miqa');
  const irgiHistory = history.filter(h => h.kid_name === 'irgi');
  
  // Gabungkan berdasarkan minggu
  const weekMap = new Map<number, { week: number; date: string; miqa?: number; irgi?: number }>();
  
  miqaHistory.forEach(h => {
    weekMap.set(h.week_number, { 
      week: h.week_number, 
      date: h.week_start, 
      miqa: h.total_points 
    });
  });
  
  irgiHistory.forEach(h => {
    const existing = weekMap.get(h.week_number);
    if (existing) {
      existing.irgi = h.total_points;
    } else {
      weekMap.set(h.week_number, { 
        week: h.week_number, 
        date: h.week_start, 
        irgi: h.total_points 
      });
    }
  });

  const weeks = Array.from(weekMap.values()).sort((a, b) => a.week - b.week);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="font-baloo font-bold text-xl mb-4">📊 Rekap Poin Mingguan</h2>
        
        {weeks.length === 0 ? (
          <p className="text-center text-ink-soft py-8">Belum ada minggu yang tersimpan. Mulai centang tugas yuk!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-violet text-white">
                  <th className="p-3 font-baloo rounded-l-lg">Minggu</th>
                  <th className="p-3 font-baloo">Tanggal</th>
                  <th className="p-3 font-baloo">🦄 Miqa</th>
                  <th className="p-3 font-baloo">🚀 Irgi</th>
                  <th className="p-3 font-baloo rounded-r-lg">Juara</th>
                </tr>
              </thead>
              <tbody>
                {weeks.map(w => {
                  let juara = '-';
                  if (w.miqa !== undefined && w.irgi !== undefined) {
                    if (w.miqa > w.irgi) juara = '🦄 Miqa';
                    else if (w.irgi > w.miqa) juara = '🚀 Irgi';
                    else juara = '🤝 Seri';
                  }
                  return (
                    <tr key={w.week} className="border-b border-line">
                      <td className="p-3 text-center font-bold">{w.week}</td>
                      <td className="p-3 text-center">{formatDate(w.date)}</td>
                      <td className="p-3 text-center">{w.miqa ?? '-'}</td>
                      <td className="p-3 text-center">{w.irgi ?? '-'}</td>
                      <td className="p-3 text-center font-bold">{juara}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => onFinishWeek('miqa')}
          className="bg-gradient-to-br from-miqa to-pink-300 text-white rounded-2xl p-6 shadow-lg hover:scale-105 transition-all"
        >
          <div className="text-4xl mb-2">🦄</div>
          <div className="font-baloo font-bold text-lg">Selesaikan Minggu Miqa</div>
          <div className="text-sm opacity-90 mt-1">Simpan poin & mulai minggu baru</div>
        </button>
        <button
          onClick={() => onFinishWeek('irgi')}
          className="bg-gradient-to-br from-irgi to-blue-300 text-white rounded-2xl p-6 shadow-lg hover:scale-105 transition-all"
        >
          <div className="text-4xl mb-2">🚀</div>
          <div className="font-baloo font-bold text-lg">Selesaikan Minggu Irgi</div>
          <div className="text-sm opacity-90 mt-1">Simpan poin & mulai minggu baru</div>
        </button>
      </div>
    </div>
  );
}