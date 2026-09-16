export interface Task {
  id: string;
  icon: string;
  name: string;
  points: number;
}

export interface Reward {
  id: string;
  icon: string;
  name: string;
  min_points: number;
}

export interface Checklist {
  id: string;
  kid_name: string;
  task_id: string;
  day_of_week: string;
  completed: boolean;
  week_number: number;
  week_start: string;
}

export interface History {
  id: string;
  kid_name: string;
  week_number: number;
  week_start: string;
  total_points: number;
}

export interface Claim {
  id: string;
  kid_name: string;
  reward_name: string;
  points_cost: number;
  claim_date: string;
}

export type KidName = 'miqa' | 'irgi';

export const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];