'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Task, Reward, Checklist, History, Claim, KidName } from '@/types';
import { todayISO } from '@/lib/utils';

// Import semua komponen
import Navbar from '@/components/Navbar';
import Dashboard from '@/components/Dashboard';
import ChecklistView from '@/components/Checklist';
import Rewards from '@/components/Rewards';
import HistoryView from '@/components/History';
import Certificate from '@/components/Certificate';

export default function DashboardPage() {
  const [activeView, setActiveView] = useState('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

  // Ambil data saat pertama load
  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) router.push('/login');
  };

  const loadData = async () => {
    try {
      const [t, r, c, h, cl] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at'),
        supabase.from('rewards').select('*').order('min_points'),
        supabase.from('checklists').select('*'),
        supabase.from('history').select('*').order('week_number'),
        supabase.from('claims').select('*').order('claim_date', { ascending: false })
      ]);
      
      setTasks(t.data || []);
      setRewards(r.data || []);
      setChecklists(c.data || []);
      setHistory(h.data || []);
      setClaims(cl.data || []);
    } catch (err) {
      console.error('Error loading:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const toggleChecklist = async (taskId: string, day: string, kidName: KidName) => {
    const existing = checklists.find(
      c => c.task_id === taskId && c.day_of_week === day && c.kid_name === kidName
    );

    if (existing) {
      await supabase
        .from('checklists')
        .update({ completed: !existing.completed })
        .eq('id', existing.id);
    } else {
      await supabase.from('checklists').insert({
        kid_name: kidName,
        task_id: taskId,
        day_of_week: day,
        completed: true,
        week_number: 1,
        week_start: todayISO()
      });
    }
    loadData();
  };

  const handleClaimReward = async (kidName: KidName, reward: Reward) => {
    await supabase.from('claims').insert({
      kid_name: kidName,
      reward_name: reward.name,
      points_cost: reward.min_points,
      claim_date: todayISO()
    });
    loadData();
  };

  const handleFinishWeek = async (kidName: KidName) => {
    const currentPoints = checklists
      .filter(c => c.kid_name === kidName && c.completed)
      .reduce((sum, c) => {
        const task = tasks.find(t => t.id === c.task_id);
        return sum + (task?.points || 0);
      }, 0);

    if (!confirm(`Simpan ${currentPoints} poin untuk minggu ini?`)) return;

    // Simpan ke history
    await supabase.from('history').insert({
      kid_name: kidName,
      week_number: history.filter(h => h.kid_name === kidName).length + 1,
      week_start: todayISO(),
      total_points: currentPoints
    });

    // Hapus checklist minggu ini
    await supabase
      .from('checklists')
      .delete()
      .eq('kid_name', kidName);

    loadData();
    alert('✅ Minggu tersimpan! Siap untuk minggu baru!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-violet font-baloo text-xl">⏳ Memuat...</div>
      </div>
    );
  }

  const miqaPoints = checklists
    .filter(c => c.kid_name === 'miqa' && c.completed)
    .reduce((sum, c) => sum + (tasks.find(t => t.id === c.task_id)?.points || 0), 0)
    + history.filter(h => h.kid_name === 'miqa').reduce((s, h) => s + h.total_points, 0)
    - claims.filter(c => c.kid_name === 'miqa').reduce((s, c) => s + c.points_cost, 0);

  const irgiPoints = checklists
    .filter(c => c.kid_name === 'irgi' && c.completed)
    .reduce((sum, c) => sum + (tasks.find(t => t.id === c.task_id)?.points || 0), 0)
    + history.filter(h => h.kid_name === 'irgi').reduce((s, h) => s + h.total_points, 0)
    - claims.filter(c => c.kid_name === 'irgi').reduce((s, c) => s + c.points_cost, 0);

  return (
    <div className="min-h-screen bg-cream pb-20">
      <Navbar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        onLogout={handleLogout} 
      />

      <main className="max-w-4xl mx-auto my-6 px-4">
        {activeView === 'dashboard' && (
          <Dashboard 
            tasks={tasks}
            rewards={rewards}
            checklists={checklists}
            history={history}
            claims={claims}
          />
        )}

        {activeView === 'miqa' && (
          <ChecklistView
            kidName="miqa"
            tasks={tasks}
            checklists={checklists}
            onToggle={(taskId, day) => toggleChecklist(taskId, day, 'miqa')}
          />
        )}

        {activeView === 'irgi' && (
          <ChecklistView
            kidName="irgi"
            tasks={tasks}
            checklists={checklists}
            onToggle={(taskId, day) => toggleChecklist(taskId, day, 'irgi')}
          />
        )}

        {activeView === 'rewards' && (
          <Rewards
            rewards={rewards}
            claims={claims}
            miqaPoints={miqaPoints}
            irgiPoints={irgiPoints}
            onClaim={handleClaimReward}
          />
        )}

        {activeView === 'history' && (
          <HistoryView
            history={history}
            tasks={tasks}
            rewards={rewards}
            onFinishWeek={handleFinishWeek}
          />
        )}

        {activeView === 'certificate' && (
          <Certificate
            rewards={rewards}
            claims={claims}
            miqaPoints={miqaPoints}
            irgiPoints={irgiPoints}
          />
        )}
      </main>

      <footer className="text-center text-xs text-ink-soft py-4">
        Dibuat dengan ❤️ untuk Miqa & Irgi
      </footer>
    </div>
  );
}