import { Task, Checklist, DAYS, KidName } from '@/types';

interface ChecklistViewProps {
  kidName: KidName;
  tasks: Task[];
  checklists: Checklist[];
  onToggle: (taskId: string, day: string) => void;
}

export default function ChecklistView({ kidName, tasks, checklists, onToggle }: ChecklistViewProps) {
  const isMiqa = kidName === 'miqa';
  const themeColor = isMiqa ? 'bg-miqa' : 'bg-irgi';
  const emoji = isMiqa ? '🦄' : '🚀';
  const name = isMiqa ? 'Miqa' : 'Irgi';

  const totalPoints = checklists
    .filter(c => c.kid_name === kidName && c.completed)
    .reduce((sum, c) => {
      const task = tasks.find(t => t.id === c.task_id);
      return sum + (task?.points || 0);
    }, 0);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="font-baloo font-bold text-xl">
          {emoji} Checklist {name}
        </h2>
        <div className="text-sm text-ink-soft">
          Minggu ke-<span className="font-bold text-ink">1</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`${themeColor} text-white`}>
              <th className="p-3 text-left font-baloo rounded-l-lg">Tugas</th>
              <th className="p-3 font-baloo">Poin</th>
              {DAYS.map(day => (
                <th key={day} className="p-3 font-baloo">{day.slice(0, 3)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id} className="border-b border-line hover:bg-cream/50">
                <td className="p-3 font-semibold">
                  <span className="mr-2">{task.icon}</span>
                  {task.name}
                </td>
                <td className="p-3 text-center text-ink-soft font-bold">
                  {task.points}
                </td>
                {DAYS.map(day => {
                  const isChecked = checklists.some(
                    c => c.task_id === task.id 
                      && c.day_of_week === day 
                      && c.kid_name === kidName 
                      && c.completed
                  );
                  return (
                    <td key={day} className="p-2 text-center">
                      <button
                        onClick={() => onToggle(task.id, day)}
                        className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center font-bold transition-all ${
                          isChecked 
                            ? 'bg-green border-green text-white scale-110' 
                            : 'bg-white border-line hover:border-violet'
                        }`}
                      >
                        {isChecked && '✓'}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="mt-6 bg-sun-soft rounded-xl p-4 flex justify-between items-center">
        <span className="font-baloo font-bold">
          Total Poin Minggu Ini: <span className="text-violet text-lg">{totalPoints}</span>
        </span>
        <span className="text-xl">
          {'⭐'.repeat(Math.min(5, Math.floor(totalPoints / 180)))}
          {'☆'.repeat(Math.max(0, 5 - Math.floor(totalPoints / 180)))}
        </span>
      </div>
    </div>
  );
}
