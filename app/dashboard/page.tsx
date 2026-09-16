'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Task { id: string; icon: string; name: string; points: number }
interface Reward { id: string; icon: string; name: string; min_points: number }
interface ChecklistRow { id: string; kid_name: string; task_id: string; day_of_week: string; completed: boolean; week_number: number; week_start: string }
interface HistoryRow { id: string; kid_name: string; week_number: number; week_start: string; total_points: number }
interface ClaimRow { id: string; kid_name: string; reward_name: string; points_cost: number; claim_date: string }
interface Kid { id: string; slot: number; name: string; emoji: string }

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const EMOJI_CHOICES = ['🦄', '🚀', '', '', '🐼', '🦁', '', '', '🐰', '🧸', '', ''];

function todayISO() { return new Date().toISOString().slice(0, 10); }
function formatDate(iso: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function starsFor(points: number) {
  const n = Math.max(0, Math.min(5, Math.floor(points / 180)));
  return '⭐'.repeat(n) + '☆'.repeat(5 - n);
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [kids, setKids] = useState<Kid[]>([]);
  const [setup1, setSetup1] = useState({ name: '', emoji: '🦄' });
  const [setup2, setSetup2] = useState({ name: '', emoji: '🚀' });
  const [edit1, setEdit1] = useState({ name: '', emoji: '🦄' });
  const [edit2, setEdit2] = useState({ name: '', emoji: '🚀' });
  const [activeView, setActiveView] = useState('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [checklists, setChecklists] = useState<ChecklistRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [claimKid, setClaimKid] = useState('kid1');
  const [claimRewardId, setClaimRewardId] = useState('');
  const [certKid, setCertKid] = useState('kid1');
  const supabase = createClientComponentClient();
  const router = useRouter();

  const loadData = async () => {
    const [t, r, c, h, cl] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at'),
      supabase.from('rewards').select('*').order('min_points'),
      supabase.from('checklists').select('*'),
      supabase.from('history').select('*').order('week_number'),
      supabase.from('claims').select('*').order('claim_date', { ascending: false }),
    ]);
    setTasks((t.data as Task[]) || []);
    setRewards((r.data as Reward[]) || []);
    setChecklists((c.data as ChecklistRow[]) || []);
    setHistory((h.data as HistoryRow[]) || []);
    setClaims((cl.data as ClaimRow[]) || []);
  };

  const loadKids = async (): Promise<Kid[]> => {
    const { data } = await supabase.from('kids').select('*').order('slot');
    const list = (data as Kid[]) || [];
    setKids(list);
    return list;
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const list = await loadKids();
      if (list.length === 0) {
        setSetupMode(true);
        setLoading(false);
        return;
      }
      const k1 = list.find(k => k.slot === 1);
      const k2 = list.find(k => k.slot === 2);
      if (k1) setEdit1({ name: k1.name, emoji: k1.emoji });
      if (k2) setEdit2({ name: k2.name, emoji: k2.emoji });
      await loadData();
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSetup = async () => {
    const n1 = setup1.name.trim();
    const n2 = setup2.name.trim();
    if (!n1 || !n2) { alert('Isi dulu nama kedua anak ya! 😊'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('kids').insert([
      { user_id: user.id, slot: 1, name: n1, emoji: setup1.emoji },
      { user_id: user.id, slot: 2, name: n2, emoji: setup2.emoji },
    ]);
    const list = await loadKids();
    const k1 = list.find(k => k.slot === 1);
    const k2 = list.find(k => k.slot === 2);
    if (k1) setEdit1({ name: k1.name, emoji: k1.emoji });
    if (k2) setEdit2({ name: k2.name, emoji: k2.emoji });
    setSetupMode(false);
    await loadData();
  };

  const saveSettings = async () => {
    const k1 = kids.find(k => k.slot === 1);
    const k2 = kids.find(k => k.slot === 2);
    if (!k1 || !k2) return;
    if (!edit1.name.trim() || !edit2.name.trim()) { alert('Nama tidak boleh kosong ya! 😊'); return; }
    await supabase.from('kids').update({ name: edit1.name.trim(), emoji: edit1.emoji }).eq('id', k1.id);
    await supabase.from('kids').update({ name: edit2.name.trim(), emoji: edit2.emoji }).eq('id', k2.id);
    await loadKids();
    alert('✅ Pengaturan tersimpan!');
  };

  const kid1 = kids.find(k => k.slot === 1);
  const kid2 = kids.find(k => k.slot === 2);
  const kidOfKey = (key: string) => kids.find(k => `kid${k.slot}` === key);
  const nameOf = (key: string) => kidOfKey(key)?.name || '-';
  const emojiOf = (key: string) => kidOfKey(key)?.emoji || '🌟';

  const pointsOf = (key: string) => {
    const cur = checklists.filter(c => c.kid_name === key && c.completed)
      .reduce((s, c) => s + (tasks.find(t => t.id === c.task_id)?.points || 0), 0);
    const hist = history.filter(x => x.kid_name === key).reduce((s, x) => s + x.total_points, 0);
    const clm = claims.filter(x => x.kid_name === key).reduce((s, x) => s + x.points_cost, 0);
    return cur + hist - clm;
  };
  const p1 = pointsOf('kid1');
  const p2 = pointsOf('kid2');

  const toggleChecklist = async (taskId: string, day: string, key: string) => {
    const existing = checklists.find(c => c.task_id === taskId && c.day_of_week === day && c.kid_name === key);
    if (existing) {
      await supabase.from('checklists').update({ completed: !existing.completed }).eq('id', existing.id);
    } else {
      await supabase.from('checklists').insert({ kid_name: key, task_id: taskId, day_of_week: day, completed: true, week_number: 1, week_start: todayISO() });
    }
    await loadData();
  };

  const doClaim = async (key: string, rw: Reward) => {
    await supabase.from('claims').insert({ kid_name: key, reward_name: rw.name, points_cost: rw.min_points, claim_date: todayISO() });
    await loadData();
  };

  const finishWeek = async (key: string) => {
    const cur = checklists.filter(c => c.kid_name === key && c.completed)
      .reduce((s, c) => s + (tasks.find(t => t.id === c.task_id)?.points || 0), 0);
    if (!confirm(`Simpan ${cur} poin untuk ${nameOf(key)} dan mulai minggu baru?`)) return;
    const weekNo = history.filter(x => x.kid_name === key).length + 1;
    await supabase.from('history').insert({ kid_name: key, week_number: weekNo, week_start: todayISO(), total_points: cur });
    await supabase.from('checklists').delete().eq('kid_name', key);
    await loadData();
    alert('✅ Minggu tersimpan! Siap untuk minggu baru!');
  };

  const logout = async () => { await supabase.auth.signOut(); router.push('/login'); };

  const tabs = [
    { id: 'dashboard', label: '🌈 Dashboard' },
    ...(kid1 ? [{ id: 'kid1', label: `${kid1.emoji} ${kid1.name}` }] : []),
    ...(kid2 ? [{ id: 'kid2', label: `${kid2.emoji} ${kid2.name}` }] : []),
    { id: 'rewards', label: '🎁 Reward' },
    { id: 'history', label: '📊 Rekap' },
    { id: 'certificate', label: '🏅 Piagam' },
    { id: 'settings', label: '⚙️ Pengaturan' },
  ];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-cream"><div className="font-baloo text-xl text-violet">⏳ Memuat...</div></div>;
  }

  if (setupMode) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <h1 className="font-baloo font-bold text-2xl text-violet text-center mb-1">👋 Selamat Datang!</h1>
          <p className="text-center text-ink-soft text-sm mb-6">Sebelum mulai, tulis dulu nama dua anak hebat kita ya!</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">Nama Anak Pertama</label>
              <div className="flex gap-2">
                <select value={setup1.emoji} onChange={e => setSetup1({ ...setup1, emoji: e.target.value })} className="px-3 py-3 border-2 border-line rounded-xl text-xl">
                  {EMOJI_CHOICES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <input value={setup1.name} onChange={e => setSetup1({ ...setup1, name: e.target.value })} placeholder="Contoh: Miqa" className="flex-1 px-4 py-3 border-2 border-line rounded-xl" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Nama Anak Kedua</label>
              <div className="flex gap-2">
                <select value={setup2.emoji} onChange={e => setSetup2({ ...setup2, emoji: e.target.value })} className="px-3 py-3 border-2 border-line rounded-xl text-xl">
                  {EMOJI_CHOICES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <input value={setup2.name} onChange={e => setSetup2({ ...setup2, name: e.target.value })} placeholder="Contoh: Irgi" className="flex-1 px-4 py-3 border-2 border-line rounded-xl" />
              </div>
            </div>
            <button onClick={saveSetup} className="w-full bg-violet hover:bg-violet/90 text-white font-baloo font-bold rounded-xl py-3">🚀 Mulai Petualangan!</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-16">
      <div className="print:hidden bg-gradient-to-br from-violet to-purple-400 text-white py-6 px-4 text-center relative overflow-hidden">
        <h1 className="text-2xl md:text-3xl font-baloo font-bold relative z-10">🌟 Papan Tugas — {kid1?.name || ''} & {kid2?.name || ''} 🌟</h1>
        <p className="text-sm opacity-90 mt-1 relative z-10">Beres-beres rumah, kumpulkan poin, tukar dengan reward seru!</p>
        <button onClick={logout} className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold">Logout</button>
      </div>

      <nav className="print:hidden max-w-4xl mx-auto -mt-9 bg-white rounded-2xl shadow-lg flex flex-wrap gap-1 p-2 relative z-20">
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setActiveView(tb.id)}
            className={`flex-1 min-w-[90px] py-3 px-2 rounded-xl font-baloo font-semibold text-sm transition-all ${activeView === tb.id ? 'bg-violet text-white' : 'text-ink-soft hover:bg-violet-soft'}`}>
            {tb.label}
          </button>
        ))}
      </nav>

      <main className="max-w-4xl mx-auto my-6 px-4">

        {activeView === 'dashboard' && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-miqa to-pink-300 rounded-2xl p-6 text-white">
                <div className="font-baloo font-bold text-xl">{kid1?.emoji} {kid1?.name}</div>
                <div className="font-baloo text-5xl font-bold">{p1}<span className="text-lg opacity-85 ml-2">poin</span></div>
                <div className="mt-2 text-lg">{starsFor(p1)}</div>
              </div>
              <div className="bg-gradient-to-br from-irgi to-blue-300 rounded-2xl p-6 text-white">
                <div className="font-baloo font-bold text-xl">{kid2?.emoji} {kid2?.name}</div>
                <div className="font-baloo text-5xl font-bold">{p2}<span className="text-lg opacity-85 ml-2">poin</span></div>
                <div className="mt-2 text-lg">{starsFor(p2)}</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <h2 className="font-baloo font-bold text-lg mb-2">🏁 Papan Juara</h2>
              {p1 === 0 && p2 === 0 ? <p className="text-ink-soft">Yuk mulai centang tugas hari ini! 🌟</p>
                : p1 === p2 ? <p className="font-semibold">🤝 {kid1?.name} & {kid2?.name} seri! Sama-sama juara!</p>
                : p1 > p2 ? <p className="font-semibold">{kid1?.emoji} {kid1?.name} unggul sementara — {kid2?.name}, ayo kejar! {kid2?.emoji}</p>
                : <p className="font-semibold">{kid2?.emoji} {kid2?.name} unggul sementara — {kid1?.name}, semangat! {kid1?.emoji}</p>}
            </div>
          </div>
        )}

        {(activeView === 'kid1' || activeView === 'kid2') && (() => {
          const key = activeView;
          const kid = kidOfKey(key);
          if (!kid) return null;
          const isOne = kid.slot === 1;
          const total = checklists.filter(c => c.kid_name === key && c.completed)
            .reduce((s, c) => s + (tasks.find(t => t.id === c.task_id)?.points || 0), 0);
          return (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-baloo font-bold text-xl mb-4">{kid.emoji} Checklist {kid.name}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${isOne ? 'bg-miqa' : 'bg-irgi'} text-white`}>
                      <th className="p-3 text-left font-baloo">Tugas</th>
                      <th className="p-3 font-baloo">Poin</th>
                      {DAYS.map(d => <th key={d} className="p-3 font-baloo">{d.slice(0, 3)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task.id} className="border-b border-line">
                        <td className="p-3 font-semibold">{task.icon} {task.name}</td>
                        <td className="p-3 text-center text-ink-soft font-bold">{task.points}</td>
                        {DAYS.map(d => {
                          const row = checklists.find(c => c.task_id === task.id && c.day_of_week === d && c.kid_name === key);
                          const on = !!row?.completed;
                          return (
                            <td key={d} className="p-2 text-center">
                              <button onClick={() => toggleChecklist(task.id, d, key)}
                                className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center font-bold ${on ? 'bg-green border-green text-white' : 'bg-white border-line hover:border-violet'}`}>
                                {on ? '✓' : ''}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 bg-sun-soft rounded-xl p-4 flex justify-between items-center">
                <span className="font-baloo font-bold">Total Poin Minggu Ini: <span className="text-violet text-lg">{total}</span></span>
                <span className="text-xl">{starsFor(total)}</span>
              </div>
            </div>
          );
        })()}

        {activeView === 'rewards' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-baloo font-bold text-xl mb-4">🏆 Daftar Reward</h2>
              <div className="space-y-3">
                {rewards.map(rw => (
                  <div key={rw.id} className="flex items-center gap-3 p-4 bg-cream rounded-xl border border-line">
                    <div className="text-3xl">{rw.icon}</div>
                    <div className="flex-1">
                      <div className="font-baloo font-bold">{rw.name}</div>
                      <div className="text-sm text-ink-soft">Butuh {rw.min_points} poin</div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${p1 >= rw.min_points ? 'bg-green-100 text-green' : 'bg-gray-100 text-gray-500'}`}>{kid1?.emoji} {p1 >= rw.min_points ? 'Tercapai' : 'Belum'}</span>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${p2 >= rw.min_points ? 'bg-green-100 text-green' : 'bg-gray-100 text-gray-500'}`}>{kid2?.emoji} {p2 >= rw.min_points ? 'Tercapai' : 'Belum'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-baloo font-bold text-xl mb-4">🎁 Klaim Reward</h2>
              <div className="grid md:grid-cols-3 gap-3">
                <select value={claimKid} onChange={e => setClaimKid(e.target.value)} className="px-4 py-3 border-2 border-line rounded-xl">
                  <option value="kid1">{kid1?.emoji} {kid1?.name}</option>
                  <option value="kid2">{kid2?.emoji} {kid2?.name}</option>
                </select>
                <select value={claimRewardId} onChange={e => setClaimRewardId(e.target.value)} className="px-4 py-3 border-2 border-line rounded-xl">
                  <option value="">Pilih reward...</option>
                  {rewards.map(rw => <option key={rw.id} value={rw.id}>{rw.icon} {rw.name} ({rw.min_points} poin)</option>)}
                </select>
                <button onClick={() => {
                  const rw = rewards.find(x => x.id === claimRewardId);
                  if (!rw) return;
                  const avail = pointsOf(claimKid);
                  if (avail < rw.min_points) { alert('Poin belum cukup! 😅'); return; }
                  if (confirm(`Klaim ${rw.name} untuk ${nameOf(claimKid)}?`)) doClaim(claimKid, rw);
                }} className="bg-violet hover:bg-violet/90 text-white font-baloo font-semibold rounded-xl px-4 py-3">Klaim Sekarang</button>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-baloo font-bold text-xl mb-4">📜 Riwayat Klaim</h2>
              {claims.length === 0 ? <p className="text-center text-ink-soft py-4">Belum ada reward yang diklaim.</p> : (
                <div className="space-y-2">
                  {claims.map(cl => (
                    <div key={cl.id} className="flex justify-between items-center p-3 border-b border-line text-sm">
                      <span><span className={`text-xs px-3 py-1 rounded-full font-bold text-white mr-2 ${cl.kid_name === 'kid1' ? 'bg-miqa' : 'bg-irgi'}`}>{emojiOf(cl.kid_name)} {nameOf(cl.kid_name)}</span>{cl.reward_name}</span>
                      <span className="text-ink-soft">{formatDate(cl.claim_date)} · -{cl.points_cost} poin</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'history' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-baloo font-bold text-xl mb-4">📊 Rekap Poin Mingguan</h2>
              {history.length === 0 ? <p className="text-center text-ink-soft py-6">Belum ada minggu yang tersimpan.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-violet text-white">
                      <th className="p-3 font-baloo">Minggu</th><th className="p-3 font-baloo">Tanggal</th><th className="p-3 font-baloo">{kid1?.emoji} {kid1?.name}</th><th className="p-3 font-baloo">{kid2?.emoji} {kid2?.name}</th>
                    </tr></thead>
                    <tbody>
                      {history.map(h => (
                        <tr key={h.id} className="border-b border-line">
                          <td className="p-3 text-center font-bold">{h.week_number}</td>
                          <td className="p-3 text-center">{formatDate(h.week_start)}</td>
                          <td className="p-3 text-center">{h.kid_name === 'kid1' ? h.total_points : '-'}</td>
                          <td className="p-3 text-center">{h.kid_name === 'kid2' ? h.total_points : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <button onClick={() => finishWeek('kid1')} className="bg-gradient-to-br from-miqa to-pink-300 text-white rounded-2xl p-6 shadow-lg font-baloo font-bold text-lg">{kid1?.emoji} Simpan Minggu {kid1?.name}</button>
              <button onClick={() => finishWeek('kid2')} className="bg-gradient-to-br from-irgi to-blue-300 text-white rounded-2xl p-6 shadow-lg font-baloo font-bold text-lg">{kid2?.emoji} Simpan Minggu {kid2?.name}</button>
            </div>
          </div>
        )}

        {activeView === 'certificate' && (() => {
          const pts = pointsOf(certKid);
          const name = nameOf(certKid);
          const emoji = emojiOf(certKid);
          const topReward = rewards.filter(r => pts >= r.min_points).sort((a, b) => b.min_points - a.min_points)[0];
          return (
            <div className="bg-gradient-to-b from-yellow-50 to-cream border-8 border-sun rounded-3xl p-8 md:p-10 text-center shadow-2xl">
              <div className="print:hidden mb-4 flex justify-center gap-3">
                <select value={certKid} onChange={e => setCertKid(e.target.value)} className="px-4 py-2 border-2 border-line rounded-xl">
                  <option value="kid1">{kid1?.emoji} {kid1?.name}</option>
                  <option value="kid2">{kid2?.emoji} {kid2?.name}</option>
                </select>
                <button onClick={() => window.print()} className="bg-violet text-white font-baloo font-semibold rounded-xl px-4 py-2">🖨️ Cetak Piagam</button>
              </div>
              <h2 className="text-sm tracking-[4px] text-violet font-bold">PIAGAM PENGHARGAAN</h2>
              <h1 className="font-baloo text-3xl md:text-4xl my-3">🏆 Sertifikat Anak Hebat 🏆</h1>
              <p className="text-ink-soft text-sm">Dengan bangga diberikan kepada:</p>
              <div className={`font-baloo text-4xl md:text-5xl my-5 ${certKid === 'kid1' ? 'text-miqa' : 'text-irgi'}`}>{emoji} {name}</div>
              <p className="max-w-md mx-auto text-sm md:text-base leading-relaxed mb-6">Atas semangat, tanggung jawab, dan kerja keras menyelesaikan tugas rumah dengan penuh senyum! 🌟</p>
              <p className="font-baloo font-bold">🏆 Total Poin Diraih: <span className="text-violet">{pts}</span></p>
              <p className="font-baloo font-bold">🎁 Reward Tertinggi: <span className="text-violet">{topReward ? `${topReward.icon} ${topReward.name}` : 'Belum ada, semangat terus!'}</span></p>
              <p className="text-sm text-ink-soft font-semibold mt-2">📅 {formatDate(todayISO())}</p>
              <div className="grid grid-cols-2 gap-8 mt-16 max-w-md mx-auto text-sm text-ink-soft">
                <div className="border-t-2 border-ink-soft pt-2">Orang Tua / Wali</div>
                <div className="border-t-2 border-ink-soft pt-2">{name}</div>
              </div>
            </div>
          );
        })()}

        {activeView === 'settings' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="font-baloo font-bold text-xl mb-4">⚙️ Pengaturan Nama Anak</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Anak Pertama</label>
                <div className="flex gap-2">
                  <select value={edit1.emoji} onChange={e => setEdit1({ ...edit1, emoji: e.target.value })} className="px-3 py-3 border-2 border-line rounded-xl text-xl">
                    {EMOJI_CHOICES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <input value={edit1.name} onChange={e => setEdit1({ ...edit1, name: e.target.value })} className="flex-1 px-4 py-3 border-2 border-line rounded-xl" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Anak Kedua</label>
                <div className="flex gap-2">
                  <select value={edit2.emoji} onChange={e => setEdit2({ ...edit2, emoji: e.target.value })} className="px-3 py-3 border-2 border-line rounded-xl text-xl">
                    {EMOJI_CHOICES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <input value={edit2.name} onChange={e => setEdit2({ ...edit2, name: e.target.value })} className="flex-1 px-4 py-3 border-2 border-line rounded-xl" />
                </div>
              </div>
              <button onClick={saveSettings} className="bg-violet hover:bg-violet/90 text-white font-baloo font-semibold rounded-xl px-6 py-3">💾 Simpan Perubahan</button>
            </div>
            <p className="text-xs text-ink-soft mt-4">💡 Mengganti nama tidak menghapus poin & riwayat. Semua data tetap aman milik anak yang sama.</p>
          </div>
        )}

      </main>
      <footer className="print:hidden text-center text-xs text-ink-soft py-4">Dibuat dengan ❤️ untuk keluarga Indonesia</footer>
    </div>
  );
}
