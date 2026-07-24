export type Category = 'Sub Junior' | 'Junior' | 'Senior'
export type EventType = 'individual' | 'group'
export type EventStatus = 'open' | 'locked'
export type Rank = 1 | 2 | 3

export interface School {
  id: string
  name: string
  logo_url: string | null
  created_at: string
}

export interface Group {
  id: string
  name: string
  color: string | null
  created_at: string
}

export interface Student {
  id: string
  name: string
  class: string
  category: Category
  group_id: string | null
  photo_url: string | null
  created_at: string
  // Joined fields
  groups?: Group | null
  participation_count?: number
}

export interface Event {
  id: string
  school_id: string
  name: string
  type: EventType
  category: Category
  points_1st: number
  points_2nd: number
  points_3rd: number
  point_multiplier: number
  status: EventStatus
  created_at: string
}

export interface Participant {
  id: string
  event_id: string
  student_id: string | null
  group_id: string | null
  // Joined fields
  students?: Student | null
  groups?: Group | null
}

export interface Result {
  id: string
  event_id: string
  rank: Rank
  student_id: string | null
  group_id: string | null
  points_earned: number
  created_at: string
  // Joined fields
  students?: Student | null
  groups?: Group | null
  events?: Event | null
}

// Leaderboard types
export interface IndividualLeaderboardEntry {
  student_id: string
  student_name: string
  class: string
  group_name: string | null
  group_color: string | null
  category: Category
  total_points: number
  gold_count: number
  silver_count: number
  bronze_count: number
}

export interface GroupLeaderboardEntry {
  group_id: string
  group_name: string
  group_color: string | null
  total_points: number
  gold_count: number
  silver_count: number
  bronze_count: number
}

// Dashboard stats
export interface DashboardStats {
  total_students: number
  total_groups: number
  total_events: number
  open_events: number
  locked_events: number
}

// Database types for Supabase client
export type Database = {
  public: {
    Tables: {
      groups: {
        Row: Group
        Insert: Omit<Group, 'id' | 'created_at'>
        Update: Partial<Omit<Group, 'id' | 'created_at'>>
        Relationships: any[]
      }
      students: {
        Row: Student
        Insert: Omit<Student, 'id' | 'created_at' | 'groups' | 'participation_count'>
        Update: Partial<Omit<Student, 'id' | 'created_at' | 'groups' | 'participation_count'>>
        Relationships: any[]
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at'>
        Update: Partial<Omit<Event, 'id' | 'created_at'>>
        Relationships: any[]
      }
      participants: {
        Row: Participant
        Insert: Omit<Participant, 'id' | 'students' | 'groups'>
        Update: Partial<Omit<Participant, 'id' | 'students' | 'groups'>>
        Relationships: any[]
      }
      results: {
        Row: Result
        Insert: Omit<Result, 'id' | 'created_at' | 'students' | 'groups' | 'events'>
        Update: Partial<Omit<Result, 'id' | 'created_at' | 'students' | 'groups' | 'events'>>
        Relationships: any[]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
