import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ixjqfqjqjqjqjqjqjqjq.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4anFmcWpxanFqcWpxanFqcWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTcxMTgsImV4cCI6MjA3MTE5MzExOH0.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export interface Group {
  id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Team {
  id: number
  name: string
  group_id?: number
  team_type: 'mens' | 'womens' | 'mixed'
  player1_name: string
  player2_name: string
  wins: number
  losses: number
  points_for: number
  points_against: number
  is_active: boolean
  created_at: string
  updated_at: string
  group?: Group
}

export interface Tournament {
  id: number
  name: string
  tournament_type: 'group_stage' | 'single_elimination'
  team_type?: 'mens' | 'womens' | 'mixed'
  is_active: boolean
  start_date?: string
  end_date?: string
  description?: string
  max_teams?: number
  created_at: string
  updated_at: string
}

export interface Match {
  id: number
  tournament_id?: number
  team1_id?: number
  team2_id?: number
  team1_score: number
  team2_score: number
  match_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  match_round?: 'qualification' | 'semi_final' | 'final' | 'round_16' | 'quarter_final'
  court_number?: number
  scheduled_time?: string
  actual_start_time?: string
  actual_end_time?: string
  winner_id?: number
  notes?: string
  created_at: string
  updated_at: string
  tournament?: Tournament
  team1?: Team
  team2?: Team
  winner?: Team
}

export interface AdminUser {
  id: number
  email: string
  password_hash: string
  full_name?: string
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: number
  admin_user_id?: number
  action: string
  table_name?: string
  record_id?: number
  old_values?: any
  new_values?: any
  ip_address?: string
  user_agent?: string
  created_at: string
  admin_user?: AdminUser
}