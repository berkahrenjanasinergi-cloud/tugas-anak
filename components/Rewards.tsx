import { useState } from 'react';
import { Reward, Claim, KidName } from '@/types';

interface RewardsProps {
  rewards: Reward[];
  claims: Claim[];
  miqaPoints: number;
  irgiPoints: number;
  onClaim: (kidName: KidName, reward: Reward) => void;
}

export default function Rewards({ rewards, claims, miqaPoints, irgiPoints, onClaim }: RewardsProps) {
  const [selectedKid, setSelectedKid] = useState<KidName>('miqa');
  const [selectedReward, setSelectedReward] = useState<string>('');

  const handleClaim = () => {
    const reward = rewards.find(r => r.id === selectedReward);
    if (!reward) return;
    
    const availablePoints = selectedKid === 'miqa' ? miqaPoints : irgiPoints;
    
    if (availablePoints < reward.min_points) {
      alert(`Poin ${selectedKid === 'miqa' ? 'Miqa' : 'Irgi'} belum cukup! Butuh ${reward.min_points}, baru punya ${availablePoints}.`);
      return;
    }

    if (confirm(`Klaim "${reward.name}" seharga ${reward.min_points} poin?`)) {
      onClaim(selectedKid, reward);
      setSelectedReward('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Reward List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="font-baloo font-bold text-xl mb-4">🏆 Daftar Reward</h2>
        <div className="space-y-3">
          {rewards.map(reward => {
            const miqaCanClaim = miqaPoints >= reward.min_points;
            const irgiCanClaim = irgiPoints >= reward.min_points;
            return (
              <div 
                key={reward.id} 
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  miqaCanClaim || irgiCanClaim 
                    ? 'bg-cream border-sun' 
                    : 'bg-gray-50 border-line opacity-75'
                }`}
              >
                <div className="text-4xl">{reward.icon}</div>
                <div className="flex-1">
                  <div className="font-baloo font-bold text-base">{reward.name}</div>
                  <div className="text-sm text-ink-soft">Butuh {reward.min_points} poin</div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    miqaCanClaim ? 'bg-green-100 text-green' : 'bg-gray-100 text-gray-500'
                  }`}>
                    🦄 {miqaCanClaim ? 'Tercapai' : 'Belum'}
                  </span>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    irgiCanClaim ? 'bg-green-100 text-green' : 'bg-gray-100 text-gray-500'
                  }`}>
                    🚀 {irgiCanClaim ? 'Tercapai' : 'Belum'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Claim Form */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="font-baloo font-bold text-xl mb-4">🎁 Klaim Reward</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <select
            value={selectedKid}
            onChange={(e) => setSelectedKid(e.target.value as KidName)}
            className="px-4 py-3 border-2 border-line rounded-xl font-nunito focus:border-violet outline-none"
          >
            <option value="miqa">🦄 Miqa</option>
            <option value="irgi">🚀 Irgi</option>
          </select>
          <select
            value={selectedReward}
            onChange={(e) => setSelectedReward(e.target.value)}
            className="px-4 py-3 border-2 border-line rounded-xl font-nunito focus:border-violet outline-none"
          >
            <option value="">Pilih Reward...</option>
            {rewards.map(r => (
              <option key={r.id} value={r.id}>
                {r.icon} {r.name} ({r.min_points} poin)
              </option>
            ))}
          </select>
          <button
            onClick={handleClaim}
            disabled={!selectedReward}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Klaim Sekarang
          </button>
        </div>
        <p className="text-xs text-ink-soft mt-3">
          💡 Poin akan otomatis dikurangi setelah reward diklaim.
        </p>
      </div>

      {/* Claim History */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="font-baloo font-bold text-xl mb-4">📜 Riwayat Klaim</h2>
        {claims.length === 0 ? (
          <p className="text-center text-ink-soft py-6">Belum ada reward yang diklaim.</p>
        ) : (
          <div className="space-y-2">
            {claims.map(claim => (
              <div key={claim.id} className="flex justify-between items-center p-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-bold text-white ${
                    claim.kid_name === 'miqa' ? 'bg-miqa' : 'bg-irgi'
                  }`}>
                    {claim.kid_name === 'miqa' ? '🦄 Miqa' : '🚀 Irgi'}
                  </span>
                  <span className="font-semibold">{claim.reward_name}</span>
                </div>
                <div className="text-sm text-ink-soft">
                  {claim.claim_date} · <span className="text-red-500">-{claim.points_cost} poin</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
