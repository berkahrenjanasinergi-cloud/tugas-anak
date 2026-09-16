'use client';

interface NavbarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
}

export default function Navbar({ activeView, onViewChange, onLogout }: NavbarProps) {
  const tabs = [
    { id: 'dashboard', label: '🌈 Dashboard' },
    { id: 'miqa', label: '🦄 Miqa' },
    { id: 'irgi', label: '🚀 Irgi' },
    { id: 'rewards', label: '🎁 Reward' },
    { id: 'history', label: '📊 Rekap' },
    { id: 'certificate', label: '🏅 Piagam' },
  ];

  return (
    <>
      {/* Top Bar */}
      <div className="bg-gradient-to-br from-violet to-purple-400 text-white py-6 px-4 text-center relative overflow-hidden">
        <div className="absolute bg-white/10 rounded-full w-44 h-44 -top-20 -left-10"></div>
        <div className="absolute bg-white/10 rounded-full w-32 h-32 -bottom-16 right-10"></div>
        <h1 className="text-3xl font-baloo font-bold relative z-10">
          🌟 Papan Tugas — Miqa & Irgi 🌟
        </h1>
        <p className="text-sm opacity-90 mt-2 relative z-10">
          Beres-beres rumah, kumpulkan poin, tukar jadi reward seru!
        </p>
        <button
          onClick={onLogout}
          className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold"
        >
          Logout
        </button>
      </div>

      {/* Tab Navigation */}
      <nav className="max-w-4xl mx-auto -mt-9 bg-white rounded-2xl shadow-lg flex flex-wrap gap-1 p-2 relative z-20">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`flex-1 min-w-[90px] py-3 px-2 rounded-xl font-baloo font-semibold text-sm transition-all ${
              activeView === tab.id
                ? 'bg-violet text-white'
                : 'text-ink-soft hover:bg-violet-soft'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </>
  );
}
