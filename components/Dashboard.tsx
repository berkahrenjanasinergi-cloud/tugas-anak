import { Task, Reward, Checklist, History, Claim, KidName } from '@/types';
import { starsFor } from '@/lib/utils';

interface DashboardProps {
  tasks: Task[];
  rewards: Reward[];
  checklists: Checklist[];
  history: History[];
  claims: Claim[];
}

export default function Dashboard({ tasks, rewards, checklists, history, claims }: DashboardProps) {
  const calculatePoints = (kidName: KidName) => {
    const currentPoints = checklists
      .filter(c => c.kid_name === kidName && c.completed)
      .reduce((sum, c) => {
        const task = tasks.find(t => t.id === c.task_id);
        return sum + (task?.points || 0);
      }, 0);

    const historyPoints = history
      .filter(h => h.kid_name === kidName)
      .reduce((sum, h) => sum + h.total_points, 0);

    const claimedPoints = claims
      .filter(c => c.kid_name === kidName)
      .reduce((sum, c) => sum + c.points_cost, 0);

    return currentPoints + historyPoints - claimedPoints;
  };

  const miqaPoints = calculatePoints('miqa');
  const irgiPoints = calculatePoints('irgi');

  return (
    <div className="space-y-4">
      {/* Kid Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Miqa Card */}
        <div className="bg-gradient-to-br from-miqa to-pink-300 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="font-baloo font-bold text-xl mb-2 flex items-center gap-2">
            🦄 Miqa
          </div>
          <div className="font-baloo text-5xl font-bold">
            {miqaPoints}
            <span className="text-lg opacity-85 ml-2">poin</span>
          </div>
          <div className="mt-2 text-lg">{starsFor(miqaPoints)}</div>
          
          {/* Progress Road */}
          <div className="mt-4">
            <div className="h-2.5 bg-white/35 rounded-full relative my-4">
              <div 
                className="absolute left-0 top-0 h-full bg-white rounded-full transition-all"
                style={{ width: `${Math.min(100, (miqaPoints / 900) * 100)}%` }}
              ></div>
            </div>
            <p className="text-sm opacity-95">
              {miqaPoints < 900 
                ? `🎯 ${900 - miqaPoints} poin lagi menuju hadiah impian!`
                : '🎉 Semua hadiah tercapai!'}
            </p>
          </div>
        </div>

        {/* Irgi Card */}
        <div className="bg-gradient-to-br from-irgi to-blue-300 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="font-baloo font-bold text-xl mb-2 flex items-center gap-2">
            🚀 Irgi
          </div>
          <div className="font-baloo text-5xl font-bold">
            {irgiPoints}
            <span className="text-lg opacity-85 ml-2">poin</span>
          </div>
          <div className="mt-2 text-lg">{starsFor(irgiPoints)}</div>
          
          {/* Progress Road */}
          <div className="mt-4">
            <div className="h-2.5 bg-white/35 rounded-full relative my-4">
              <div 
                className="absolute left-0 top-0 h-full bg-white rounded-full transition-all"
                style={{ width: `${Math.min(100, (irgiPoints / 900) * 100)}%` }}
              ></div>
            </div>
            <p className="text-sm opacity-95">
              {irgiPoints < 900 
                ? `🎯 ${900 - irgiPoints} poin lagi menuju hadiah impian!`
                : '🎉 Semua hadiah tercapai!'}
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="font-baloo font-bold text-lg mb-3">🏁 Papan Juara</h2>
        <div className="text-center py-4">
          {miqaPoints === 0 && irgiPoints === 0 ? (
            <p className="text-ink-soft">Yuk mulai centang tugas hari ini! 🌟</p>
          ) : miqaPoints === irgiPoints ? (
            <p className="font-semibold text-lg">🤝 <span className="text-violet">Miqa & Irgi seri!</span> Sama-sama juara!</p>
          ) : miqaPoints > irgiPoints ? (
            <p className="font-semibold text-lg">🦄 <span className="text-miqa">Miqa unggul sementara</span> — Irgi, ayo kejar! 🚀</p>
          ) : (
            <p className="font-semibold text-lg">🚀 <span className="text-irgi">Irgi unggul sementara</span> — Miqa, semangat! 🦄</p>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 shadow text-center">
          <div className="text-2xl mb-1">📋</div>
          <div className="font-baloo font-bold text-xl text-violet">{tasks.length}</div>
          <div className="text-xs text-ink-soft">Tugas</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow text-center">
          <div className="text-2xl mb-1">🎁</div>
          <div className="font-baloo font-bold text-xl text-violet">{rewards.length}</div>
          <div className="text-xs text-ink-soft">Reward</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow text-center">
          <div className="text-2xl mb-1">📊</div>
          <div className="font-baloo font-bold text-xl text-violet">{history.length}</div>
          <div className="text-xs text-ink-soft">Minggu</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow text-center">
          <div className="text-2xl mb-1">🏆</div>
          <div className="font-baloo font-bold text-xl text-violet">{claims.length}</div>
          <div className="text-xs text-ink-soft">Klaim</div>
        </div>
      </div>
    </div>
  );
}
