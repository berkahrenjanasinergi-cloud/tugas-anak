'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Task { id: string; icon: string; name: string; points: number }
interface Reward { id: string; icon: string; name: string; min_points: number }
interface ChecklistRow { id: string; kid_name: string; task_id: string; day_of_week: string; completed: boolean; week_number: number; week_start: string }
interface HistoryRow { id: string; kid_name: string; week_number: number; week_start: string; total_points: number }
interface ClaimRow { id: string; kid_name: string; reward_name: string; points_cost: number; claim_date: string }
interface Kid { id: string; slot: number; name: string; emoji: string; week_num?: number; week_start?: string }

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const EMOJI_CHOICES = ['🦄', '', '', '', '🐼', '🦁', '', '', '🐰', '', '', ''];
const THEMES = [
  { card: 'from-miqa to-pink-300', head: 'bg-miqa', text: 'text-miqa', tag: 'bg-miqa' },
  { card: 'from-irgi to-blue-300', head: 'bg-irgi', text: 'text-irgi', tag: 'bg-irgi' },
  { card: 'from-green to-emerald-300', head: 'bg-green', text: 'text-green', tag: 'bg-green' },
  { card: 'from-sun to-amber-300', head: 'bg-sun', text: 'text-amber-600', tag: 'bg-sun' },
  { card: 'from-violet to-purple-300', head: 'bg-violet', text: 'text-violet', tag: 'bg-violet' },
];
const themeOfSlot = (slot: number) => THEMES[(slot - 1) % THEMES.length];

function todayISO() { return new Date().toISOString().slice(0, 10); }
function formatDate(iso: string) {
  if (!iso) return '-';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function starsFor(points: number) {
  const n = Math.max(0, Math.min(5, Math.floor(points / 180)));
  return '⭐'.repeat(n) + '☆'.repeat(5 - n);
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [setupMode, setSetupMode] = useState(false);
  const [setupKids, setSetupKids] = useState<{ name: string; emoji: string }[]>([
    { name: '', emoji: '🦄' },
    { name: '', emoji: '🚀' },
  ]);
  const [kids, setKids] = useState<Kid[]>([]);
  const [editKids, setEditKids] = useState<{ id: string; slot: number; name: string; emoji: string }[]>([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [checklists, setChecklists] = useState<ChecklistRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [claimKid, setClaimKid] = useState('');
  const [claimRewardId, setClaimRewardId] = useState('');
  const [certKid, setCertKid] = useState('');
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

  const initEdit = (list: Kid[]) => setEditKids(list.map(k => ({ id: k.id, slot: k.slot, name: k.name, emoji: k.emoji })));

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setUserId(session.user.id);
      const list = await loadKids();
      if (list.length === 0) {
        setSetupMode(true);
        setLoading(false);
        return;
      }
      initEdit(list);
      setClaimKid(`kid${list[0].slot}`);
      setCertKid(`kid${list[0].slot}`);
      await loadData();
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSetup = async () => {
    if (setupKids.length === 0 || setupKids.some(k => !k.name.trim())) { alert('Isi semua nama anak ya! 😊'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    const rows = setupKids.map((k, i) => ({ user_id: user.id, slot: i + 1, name: k.name.trim(), emoji: k.emoji, week_num: 1, week_start: todayISO() }));
    await supabase.from('kids').insert(rows);
    const list = await loadKids();
    initEdit(list);
    setClaimKid(`kid${list[0].slot}`);
    setCertKid(`kid${list[0].slot}`);
    setSetupMode(false);
    await loadData();
  };

  const saveSettings = async () => {
    if (editKids.some(k => !k.name.trim())) { alert('Nama tidak boleh kosong ya! 😊'); return; }
    for (const k of editKids) {
      await supabase.from('kids').update({ name: k.name.trim(), emoji: k.emoji }).eq('id', k.id);
    }
    const list = await loadKids();
    initEdit(list);
    alert('✅ Pengaturan tersimpan!');
  };

  const addKid = async () => {
    if (!userId) return;
    const maxSlot = kids.reduce((m, k) => Math.max(m, k.slot), 0);
    await supabase.from('kids').insert({ user_id: userId, slot: maxSlot + 1, name: 'Anak Baru', emoji: '🌟', week_num: 1, week_start: todayISO() });
    const list = await loadKids();
    initEdit(list);
  };

  const deleteKid = async (slot: number) => {
    if (kids.length <= 1) { alert('Minimal harus ada 1 anak ya! 😊'); return; }
    const kid = kids.find(k => k.slot === slot);
    if (!kid) return;
    if (!confirm(`Hapus ${kid.name} beserta semua poin & riwayatnya? Tidak bisa dibatalkan!`)) return;
    const key = `kid${slot}`;
    await supabase.from('checklists').delete().eq('kid_name', key);
    await supabase.from('history').delete().eq('kid_name', key);
    await supabase.from('claims').delete().eq('kid_name', key);
    await supabase.from('kids').delete().eq('id', kid.id);
    const list = await loadKids();
    initEdit(list);
    await loadData();
    setActiveView('dashboard');
  };

  const updateTask = async (id: string, patch: Partial<Task>) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, ...patch } : t));
    await supabase.from('tasks').update(patch).eq('id', id);
  };
  const addTask = async () => {
    if (!userId) return;
    const { data } = await supabase.from('tasks').insert({ user_id: userId, icon: '🆕', name: 'Tugas Baru', points: 10 }).select();
    if (data) setTasks(ts => [...ts, ...(data as Task[])]);
  };
  const deleteTask = async (id: string) => {
    const t = tasks.find(x => x.id === id);
    if (!confirm(`Hapus tugas "${t?.name}"? Centangannya ikut terhapus.`)) return;
    setTasks(ts => ts.filter(x => x.id !== id));
    setChecklists(cs => cs.filter(c => c.task_id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };
  const updateReward = async (id: string, patch: Partial<Reward>) => {
    setRewards(rs => rs.map(r => r.id === id ? { ...r, ...patch } : r));
    await supabase.from('rewards').update(patch).eq('id', id);
  };
  const addReward = async () => {
    if (!userId) return;
    const { data } = await supabase.from('rewards').insert({ user_id: userId, icon: '🎁', name: 'Reward Baru', min_points: 100 }).select();
    if (data) setRewards(rs => [...rs, ...(data as Reward[])]);
  };
  const deleteReward = async (id: string) => {
    const r = rewards.find(x => x.id === id);
    if (!confirm(`Hapus reward "${r?.name}"?`)) return;
    setRewards(rs => rs.filter(x => x.id !== id));
    await supabase.from('rewards').delete().eq('id', id);
  };

  const kidKey = (k: Kid) => `kid${k.slot}`;
  const kidOfKey = (key: string) => kids.find(k => `kid${k.slot}` === key);
  const nameOf = (key: string) => kidOfKey(key)?.name || '-';
  const emojiOf = (key: string) => kidOfKey(key)?.emoji || '🌟';

  const currentWeekOf = (key: string) => checklists.filter(c => c.kid_name === key && c.completed)
    .reduce((s, c) => s + (tasks.find(t => t.id === c.task_id)?.points || 0), 0);

  const pointsOf = (key: string) => {
    const hist = history.filter(x => x.kid_name === key).reduce((s, x) => s + x.total_points, 0);
    const clm = claims.filter(x => x.kid_name === key).reduce((s, x) => s + x.points_cost, 0);
    return currentWeekOf(key) + hist - clm;
  };

  const toggleChecklist = async (taskId: string, day: string, key: string) => {
    const existing = checklists.find(c => c.task_id === taskId && c.day_of_week === day && c.kid_name === key);
    if (existing) {
      await supabase.from('checklists').update({ completed: !existing.completed }).eq('id', existing.id);
    } else {
      await supabase.from('checklists').insert({ user_id: userId, kid_name: key, task_id: taskId, day_of_week: day, completed: true, week_number: 1, week_start: todayISO() });
    }
    await loadData();
  };

  const doClaim = async (key: string, rw: Reward) => {
    await supabase.from('claims').insert({ user_id: userId, kid_name: key, reward_name: rw.name, points_cost: rw.min_points, claim_date: todayISO() });
    await loadData();
  };

  const finishWeek = async (key: string) => {
    const kid = kidOfKey(key);
    if (!kid) return;
    const cur = currentWeekOf(key);
    if (!confirm(`Simpan ${cur} poin untuk ${kid.name} (Minggu ke-${kid.week_num || 1}) dan mulai minggu baru?`)) return;
    await supabase.from('history').insert({ user_id: userId, kid_name: key, week_number: kid.week_num || 1, week_start: kid.week_start || todayISO(), total_points: cur });
    await supabase.from('checklists').delete().eq('kid_name', key);
    const d = new Date((kid.week_start || todayISO()) + 'T00:00:00');
    d.setDate(d.getDate() + 7);
    await supabase.from('kids').update({ week_num: (kid.week_num || 1) + 1, week_start: d.toISOString().slice(0, 10) }).eq('id', kid.id);
    const list = await loadKids();
    initEdit(list);
    await loadData();
    alert('✅ Minggu tersimpan! Siap untuk minggu baru!');
  };

  const logout = async () => { await supabase.auth.signOut(); router.push('/login'); };

  const sortedRewards = [...rewards].sort((a, b) => a.min_points - b.min_points);
  const maxReward = sortedRewards.length ? sortedRewards[sortedRewards.length - 1].min_points : 100;
  const nextRewardText = (pts: number) => {
    const next = sortedRewards.find(r => r.min_points > pts);
    return next ? `🎯 ${next.min_points - pts} poin lagi menuju ${next.icon} ${next.name}` : '🎉 Semua level reward tercapai!';
  };

  const ranked = kids.map(k => ({ k, pts: pointsOf(kidKey(k)) })).sort((a, b) => b.pts - a.pts);
  const allZero = ranked.length === 0 || ranked.every(r => r.pts === 0);
  const topTie = ranked.length > 1 && ranked[0].pts > 0 && ranked[0].pts === ranked[1].pts;

  const weeks = Array.from(new Set(history.map(h => h.week_number))).sort((a, b) => a - b);

  const tabs = [
    { id: 'dashboard', label: '🌈 Dashboard' },
    ...kids.map(k => ({ id: kidKey(k), label: `${k.emoji} ${k.name}` })),
    { id: 'rewards', label: '🎁 Reward' },
    { id: 'history', label: '📊 Rekap' },
    { id: 'certificate', label: '🏅 Piagam' },
    { id: 'settings', label: '⚙️ Pengaturan' },
  ];

  const titleNames = kids.slice(0, 3).map(k => k.name).join(', ') + (kids.length > 3 ? ` +${kids.length - 3}` : '');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-cream"><div className="font-baloo text-xl text-violet">⏳ Memuat...</div></div>;
  }

  if (setupMode) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <h1 className="font-baloo font-bold text-2xl text-violet text-center mb-1">👋 Selamat Datang!</h1>
          <p className="text-center text-ink-soft text-sm mb-6">Tulis nama anak-anak hebat di rumah kita (boleh sebanyak apa pun)!</p>
          <div className="space-y-3">
            {setupKids.map((k, i) => (
              <div key={i} className="flex gap-2">
                <select value={k.emoji} onChange={e => setSetupKids(setupKids.map((x, idx) => idx === i ? { ...x, emoji: e.target.value } : x))} className="px-3 py-3 border-2 border-line rounded-xl text-xl">
                  {EMOJI_CHOICES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
                <input value={k.name} onChange={e => setSetupKids(setupKids.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder={`Nama anak ke-${i + 1}`} className="flex-1 px-4 py-3 border-2 border-line rounded-xl" />
                {setupKids.length > 1 && (
                  <button onClick={() => setSetupKids(setupKids.filter((_, idx) => idx !== i))} className="px-3 text-red-400 hover:text-red-600 font-bold">✕</button>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setSetupKids([...setupKids, { name: '', emoji: '🌟' }])} className="mt-3 w-full bg-violet-soft text-violet font-baloo font-semibold rounded-xl py-2">➕ Tambah Anak</button>
          <button onClick={saveSetup} className="mt-4 w-full bg-violet hover:bg-violet/90 text-white font-baloo font-bold rounded-xl py-3">🚀 Mulai Petualangan!</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-16">
      <div className="print:hidden bg-gradient-to-br from-violet to-purple-400 text-white pt-6 pb-16 px-4 text-center relative overflow-hidden">
        <h1 className="text-2xl md:text-3xl font-baloo font-bold relative z-10">🌟 Papan Tugas — {titleNames} 🌟</h1>
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
              {kids.map(k => {
                const t = themeOfSlot(k.slot);
                const pts = pointsOf(kidKey(k));
                return (
                  <div key={k.id} className={`bg-gradient-to-br ${t.card} rounded-2xl p-6 text-white`}>
                    <div className="font-baloo font-bold text-xl">{k.emoji} {k.name}</div>
                    <div className="font-baloo text-5xl font-bold">{pts}<span className="text-lg opacity-85 ml-2">poin</span></div>
                    <div className="mt-2 text-lg">{starsFor(pts)}</div>
                    <div className="relative h-2.5 bg-white/35 rounded-full mt-6 mb-5">
                      <div className="absolute left-0 top-0 h-full bg-white rounded-full transition-all" style={{ width: `${Math.min(100, (pts / maxReward) * 100)}%` }}></div>
                      {sortedRewards.map(r => {
                        const done = pts >= r.min_points;
                        return (
                          <div key={r.id} title={`${r.name} (${r.min_points} poin)`}
                            style={{ left: `${Math.max(3, Math.min(97, (r.min_points / maxReward) * 100))}%` }}
                            className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 border-white/50 ${done ? 'bg-white' : 'bg-white/35 grayscale brightness-150'}`}>
                            {r.icon}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-sm opacity-95">{nextRewardText(pts)}</p>
                  </div>
                );
              })}
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <h2 className="font-baloo font-bold text-lg mb-2">🏁 Papan Juara</h2>
              {allZero ? <p className="text-ink-soft">Yuk mulai centang tugas hari ini! 🌟</p>
                : topTie ? <p className="font-semibold">🤝 {ranked[0].k.name} & {ranked[1].k.name} seri! Sama-sama juara!</p>
                : <p className="font-semibold">{ranked[0].k.emoji} {ranked[0].k.name} unggul sementara — yang lain, ayo kejar! 💪</p>}
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-baloo font-bold text-lg mb-3">📌 Minggu Berjalan</h2>
              <div className="space-y-2 text-sm leading-relaxed">
                {kids.map(k => (
                  <p key={k.id}>{k.emoji} {k.name} — Minggu ke-{k.week_num || 1} (mulai {formatDate(k.week_start || todayISO())}), poin berjalan: <b>{currentWeekOf(kidKey(k))}</b></p>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView.startsWith('kid') && (() => {
          const key = activeView;
          const kid = kidOfKey(key);
          if (!kid) return null;
          const t = themeOfSlot(kid.slot);
          const total = currentWeekOf(key);
          return (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-baloo font-bold text-xl mb-4">{kid.emoji} Checklist {kid.name}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${t.head} text-white`}>
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
                {sortedRewards.map(rw => (
                  <div key={rw.id} className="flex items-center gap-3 p-4 bg-cream rounded-xl border border-line">
                    <div className="text-3xl">{rw.icon}</div>
                    <div className="flex-1">
                      <div className="font-baloo font-bold">{rw.name}</div>
                      <div className="text-sm text-ink-soft">Butuh {rw.min_points} poin</div>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end max-w-[50%]">
                      {kids.map(k => {
                        const ok = pointsOf(kidKey(k)) >= rw.min_points;
                        return (
                          <span key={k.id} title={`${k.name}: ${ok ? 'Tercapai' : 'Belum'}`} className={`text-xs px-2 py-1 rounded-full font-semibold ${ok ? 'bg-green-100 text-green' : 'bg-gray-100 text-gray-500'}`}>{k.emoji} {ok ? '✓' : '✗'}</span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-baloo font-bold text-xl mb-4">🎁 Klaim Reward</h2>
              <div className="grid md:grid-cols-3 gap-3">
                <select value={claimKid} onChange={e => setClaimKid(e.target.value)} className="px-4 py-3 border-2 border-line rounded-xl">
                  {kids.map(k => <option key={k.id} value={kidKey(k)}>{k.emoji} {k.name}</option>)}
                </select>
                <select value={claimRewardId} onChange={e => setClaimRewardId(e.target.value)} className="px-4 py-3 border-2 border-line rounded-xl">
                  <option value="">Pilih reward...</option>
                  {sortedRewards.map(rw => <option key={rw.id} value={rw.id}>{rw.icon} {rw.name} ({rw.min_points} poin)</option>)}
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
                  {claims.map(cl => {
                    const k = kidOfKey(cl.kid_name);
                    const t = k ? themeOfSlot(k.slot) : THEMES[0];
                    return (
                      <div key={cl.id} className="flex justify-between items-center p-3 border-b border-line text-sm">
                        <span><span className={`text-xs px-3 py-1 rounded-full font-bold text-white mr-2 ${t.tag}`}>{emojiOf(cl.kid_name)} {nameOf(cl.kid_name)}</span>{cl.reward_name}</span>
                        <span className="text-ink-soft">{formatDate(cl.claim_date)} · -{cl.points_cost} poin</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'history' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-baloo font-bold text-xl mb-4">📊 Rekap Poin Mingguan</h2>
              {weeks.length === 0 ? <p className="text-center text-ink-soft py-6">Belum ada minggu yang tersimpan.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-violet text-white">
                      <th className="p-3 font-baloo">Minggu</th>
                      <th className="p-3 font-baloo">Tanggal</th>
                      {kids.map(k => <th key={k.id} className="p-3 font-baloo">{k.emoji} {k.name}</th>)}
                      <th className="p-3 font-baloo">Juara</th>
                    </tr></thead>
                    <tbody>
                      {weeks.map(w => {
                        const rows = history.filter(h => h.week_number === w);
                        const date = rows[0]?.week_start || '';
                        const withPoints = kids.map(k => ({ k, pts: rows.find(r => r.kid_name === kidKey(k))?.total_points })).filter(x => x.pts !== undefined) as { k: Kid; pts: number }[];
                        let juara = '-';
                        if (withPoints.length > 0) {
                          const max = Math.max(...withPoints.map(x => x.pts));
                          const winners = withPoints.filter(x => x.pts === max);
                          juara = winners.length > 1 ? '🤝 Seri' : `${winners[0].k.emoji} ${winners[0].k.name}`;
                        }
                        return (
                          <tr key={w} className="border-b border-line">
                            <td className="p-3 text-center font-bold">{w}</td>
                            <td className="p-3 text-center">{formatDate(date)}</td>
                            {kids.map(k => {
                              const p = rows.find(r => r.kid_name === kidKey(k))?.total_points;
                              return <td key={k.id} className="p-3 text-center">{p !== undefined ? p : '-'}</td>;
                            })}
                            <td className="p-3 text-center font-bold">{juara}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {kids.map(k => {
                const t = themeOfSlot(k.slot);
                return (
                  <button key={k.id} onClick={() => finishWeek(kidKey(k))} className={`bg-gradient-to-br ${t.card} text-white rounded-2xl p-6 shadow-lg font-baloo font-bold text-lg`}>{k.emoji} Simpan Minggu {k.name}</button>
                );
              })}
            </div>
          </div>
        )}

        {activeView === 'certificate' && (() => {
          const key = certKid || (kids[0] ? kidKey(kids[0]) : '');
          const pts = pointsOf(key);
          const name = nameOf(key);
          const emoji = emojiOf(key);
          const k = kidOfKey(key);
          const t = k ? themeOfSlot(k.slot) : THEMES[0];
          const topReward = sortedRewards.filter(r => pts >= r.min_points).sort((a, b) => b.min_points - a.min_points)[0];
          return (
            <div className="bg-gradient-to-b from-yellow-50 to-cream border-8 border-sun rounded-3xl p-8 md:p-10 text-center shadow-2xl">
              <div className="print:hidden mb-4 flex justify-center gap-3">
                <select value={key} onChange={e => setCertKid(e.target.value)} className="px-4 py-2 border-2 border-line rounded-xl">
                  {kids.map(kk => <option key={kk.id} value={kidKey(kk)}>{kk.emoji} {kk.name}</option>)}
                </select>
                <button onClick={() => window.print()} className="bg-violet text-white font-baloo font-semibold rounded-xl px-4 py-2">🖨️ Cetak Piagam</button>
              </div>
              <h2 className="text-sm tracking-[4px] text-violet font-bold">PIAGAM PENGHARGAAN</h2>
              <h1 className="font-baloo text-3xl md:text-4xl my-3">🏆 Sertifikat Anak Hebat 🏆</h1>
              <p className="text-ink-soft text-sm">Dengan bangga diberikan kepada:</p>
              <div className={`font-baloo text-4xl md:text-5xl my-5 ${t.text}`}>{emoji} {name}</div>
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
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-baloo font-bold text-xl mb-4">⚙️ Pengaturan Anak</h2>
              <div className="space-y-3">
                {editKids.map((k, i) => {
                  const t = themeOfSlot(k.slot);
                  return (
                    <div key={k.id} className="flex gap-2 items-center">
                      <span className={`w-8 h-8 rounded-full ${t.tag} text-white flex items-center justify-center font-bold text-sm`}>{i + 1}</span>
                      <select value={k.emoji} onChange={e => setEditKids(editKids.map(x => x.id === k.id ? { ...x, emoji: e.target.value } : x))} className="px-3 py-3 border-2 border-line rounded-xl text-xl">
                        {EMOJI_CHOICES.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                      <input value={k.name} onChange={e => setEditKids(editKids.map(x => x.id === k.id ? { ...x, name: e.target.value } : x))} className="flex-1 px-4 py-3 border-2 border-line rounded-xl" />
                      <button onClick={() => deleteKid(k.slot)} title="Hapus anak" className="px-3 py-3 text-red-400 hover:text-red-600 font-bold">🗑️</button>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <button onClick={addKid} className="bg-violet-soft text-violet font-baloo font-semibold rounded-xl px-5 py-3">➕ Tambah Anak</button>
                <button onClick={saveSettings} className="bg-violet hover:bg-violet/90 text-white font-baloo font-semibold rounded-xl px-6 py-3">💾 Simpan Perubahan</button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="font-baloo font-bold text-xl mb-4">🛠️ Pengaturan Tugas & Reward</h2>
              <details className="mb-4">
                <summary className="cursor-pointer font-baloo font-semibold">📋 Daftar Tugas & Nilai Poin</summary>
                <div className="mt-3 space-y-2">
                  {tasks.map(t => (
                    <div key={t.id} className="flex gap-2 items-center">
                      <input defaultValue={t.icon} onBlur={e => updateTask(t.id, { icon: e.target.value })} className="w-14 px-2 py-2 border-2 border-line rounded-xl text-center" />
                      <input defaultValue={t.name} onBlur={e => updateTask(t.id, { name: e.target.value })} className="flex-1 px-3 py-2 border-2 border-line rounded-xl" />
                      <input defaultValue={t.points} type="number" onBlur={e => updateTask(t.id, { points: Number(e.target.value) || 0 })} className="w-20 px-2 py-2 border-2 border-line rounded-xl" />
                      <button onClick={() => deleteTask(t.id)} title="Hapus tugas" className="px-2 text-red-400 hover:text-red-600 font-bold">🗑️</button>
                    </div>
                  ))}
                </div>
                <button onClick={addTask} className="mt-3 bg-violet-soft text-violet font-baloo font-semibold rounded-xl px-4 py-2">➕ Tambah Tugas</button>
              </details>
              <details>
                <summary className="cursor-pointer font-baloo font-semibold">🏆 Daftar Reward</summary>
                <div className="mt-3 space-y-2">
                  {sortedRewards.map(r => (
                    <div key={r.id} className="flex gap-2 items-center">
                      <input defaultValue={r.icon} onBlur={e => updateReward(r.id, { icon: e.target.value })} className="w-14 px-2 py-2 border-2 border-line rounded-xl text-center" />
                      <input defaultValue={r.name} onBlur={e => updateReward(r.id, { name: e.target.value })} className="flex-1 px-3 py-2 border-2 border-line rounded-xl" />
                      <input defaultValue={r.min_points} type="number" onBlur={e => updateReward(r.id, { min_points: Number(e.target.value) || 0 })} className="w-24 px-2 py-2 border-2 border-line rounded-xl" />
                      <button onClick={() => deleteReward(r.id)} title="Hapus reward" className="px-2 text-red-400 hover:text-red-600 font-bold">🗑️</button>
                    </div>
                  ))}
                </div>
                <button onClick={addReward} className="mt-3 bg-violet-soft text-violet font-baloo font-semibold rounded-xl px-4 py-2">➕ Tambah Reward</button>
              </details>
              <p className="text-xs text-ink-soft mt-4">💡 Perubahan tersimpan otomatis saat kolom selesai diketik (klik di luar kolom).</p>
            </div>
          </div>
        )}

      </main>
      <footer className="print:hidden text-center text-xs text-ink-soft py-4">Dibuat dengan ❤️ untuk keluarga Indonesia</footer>
    </div>
  );
}
