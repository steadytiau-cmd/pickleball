export interface Team {
  id: number;
  name: string;
  group_id?: number;
  team_type: 'mens' | 'womens' | 'mixed';
  tournament_type: 'group_stage' | 'mixed_double_championship';
  player1_name: string;
  player2_name: string;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  group?: Group;
}

export interface Match {
  id: number;
  tournament_id?: number;
  team1_id?: number;
  team2_id?: number;
  team1_score: number;
  team2_score: number;
  match_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  match_round?: 'qualification' | 'semi_final' | 'final' | 'round_16' | 'quarter_final';
  court_number?: number;
  scheduled_time?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  winner_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  tournament?: Tournament;
  team1?: Team;
  team2?: Team;
  winner?: Team;
}

export interface Tournament {
  id: number;
  name: string;
  tournament_type: 'group_stage' | 'elimination';
  team_type?: 'mens' | 'womens' | 'mixed';
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  description?: string;
  max_teams?: number;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}