import { useState } from 'react';
import { Reward, Claim, KidName } from '@/types';
import { formatDate, todayISO } from '@/lib/utils';

interface CertificateProps {
  rewards: Reward[];
  claims: Claim[];
  miqaPoints: number;
  irgiPoints: number;
}

export default function Certificate({ rewards, claims, miqaPoints, irgiPoints }: CertificateProps) {
  const [selectedKid, setSelectedKid] = useState<KidName>('miqa');
  
  const points = selectedKid === 'miqa' ? miqaPoints : irgiPoints;
  const name = selectedKid === 'miqa' ? 'Miqa' : 'Irgi';
  
  // Cari reward tertinggi yang sudah dicapai
  const achievedReward = rewards
    .filter(r => points >= r.min_points)
    .sort((a, b) => b.min_points - a.min_points)[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={selectedKid}
            onChange={(e) => setSelectedKid(e.target.value as KidName)}
            className="px-4 py-3 border-2 border-line rounded-xl font-nunito focus:border-violet outline-none"
          >
            <option value="miqa">🦄 Miqa</option>
            <option value="irgi">🚀 Irgi</option>
          </select>
          <button
            onClick={handlePrint}
            className="btn btn-primary no-print"
          >
            🖨️ Cetak Piagam
          </button>
        </div>
      </div>

      {/* Certificate */}
      <div className="bg-gradient-to-b from-yellow-50 to-cream border-8 border-sun rounded-3xl p-10 text-center shadow-2xl">
        <h2 className="text-sm tracking-[4px] text-violet font-bold mb-2">
          PIAGAM PENGHARGAAN
        </h2>
        <h1 className="font-baloo text-3xl md:text-4xl mb-4 text-ink">
          🏆 Sertifikat Anak Hebat 🏆
        </h1>
        <p className="text-ink-soft text-sm mb-2">Dengan bangga diberikan kepada:</p>
        <div className={`font-baloo text-4xl md:text-5xl my-6 ${
          selectedKid === 'miqa' ? 'text-miqa' : 'text-irgi'
        }`}>
          {name}
        </div>
        <p className="max-w-md mx-auto text-sm md:text-base text-ink leading-relaxed mb-6">
          Atas semangat, tanggung jawab, dan kerja keras menyelesaikan tugas rumah dengan penuh senyum! 🌟
        </p>
        
        <div className="space-y-2 mb-8">
          <p className="font-baloo font-bold text-base">
            🏆 Total Poin Diraih: <span className="text-violet">{points}</span>
          </p>
          <p className="font-baloo font-bold text-base">
            🎁 Reward Tertinggi: <span className="text-violet">
              {achievedReward ? `${achievedReward.icon} ${achievedReward.name}` : 'Belum ada, semangat terus!'}
            </span>
          </p>
          <p className="text-sm text-ink-soft font-semibold">
            📅 {formatDate(todayISO())}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-12 pt-6 max-w-md mx-auto">
          <div>
            <div className="border-t-2 border-ink-soft pt-2 text-sm text-ink-soft">
              Orang Tua / Wali
            </div>
          </div>
          <div>
            <div className="border-t-2 border-ink-soft pt-2 text-sm text-ink-soft">
              {name}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          body * { visibility: hidden; }
          .bg-gradient-to-b, .bg-gradient-to-b * { visibility: visible; }
          .bg-gradient-to-b { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            border: 8px solid #FFB627 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
