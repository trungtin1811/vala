import { createClient } from "@supabase/supabase-js";
import type {
  SkillLevel,
  EventStatus,
  BookingStatus,
  BookingApprovalStatus,
} from "@/types";

type Database = {
  public: {
    Tables: {
      courts: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          address: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
        };
        Insert: {
          owner_id: string;
          name: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
        Update: {
          name?: string;
          address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          skill_level: SkillLevel | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          phone?: string | null;
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          skill_level?: SkillLevel | null;
        };
        Update: {
          phone?: string | null;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          skill_level?: SkillLevel | null;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          host_id: string;
          title: string;
          description: string | null;
          location: string;
          court_id: string | null;
          court_address: string | null;
          latitude: number | null;
          longitude: number | null;
          event_date: string;
          event_time: string;
          event_end_time: string | null;
          event_end_date: string | null;
          status: EventStatus;
          token_cost: number;
          total_slots: number;
          booked_slots: number;
          price_min: number | null;
          price_max: number | null;
          split_evenly: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          host_id: string;
          title: string;
          description?: string | null;
          location: string;
          court_id?: string | null;
          court_address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          event_date: string;
          event_time: string;
          event_end_time?: string | null;
          event_end_date?: string | null;
          status?: EventStatus;
          token_cost?: number;
          total_slots?: number;
          booked_slots?: number;
          price_min?: number | null;
          price_max?: number | null;
          split_evenly?: boolean;
        };
        Update: {
          title?: string;
          description?: string | null;
          location?: string;
          court_id?: string | null;
          court_address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          event_date?: string;
          event_time?: string;
          event_end_time?: string | null;
          event_end_date?: string | null;
          status?: EventStatus;
          token_cost?: number;
          total_slots?: number;
          booked_slots?: number;
          price_min?: number | null;
          price_max?: number | null;
          split_evenly?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      event_skill_requirements: {
        Row: {
          id: string;
          event_id: string;
          skill_level: SkillLevel;
        };
        Insert: {
          event_id: string;
          skill_level: SkillLevel;
        };
        Update: {
          skill_level?: SkillLevel;
        };
        Relationships: [
          {
            foreignKeyName: "event_skill_requirements_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          event_id: string;
          member_id: string;
          skill_level: SkillLevel;
          status: BookingStatus;
          approval_status: BookingApprovalStatus;
          is_paid: boolean;
          paid_at: string | null;
          booked_at: string;
        };
        Insert: {
          event_id: string;
          member_id: string;
          skill_level: SkillLevel;
          status?: BookingStatus;
          approval_status?: BookingApprovalStatus;
          is_paid?: boolean;
          paid_at?: string | null;
        };
        Update: {
          status?: BookingStatus;
          approval_status?: BookingApprovalStatus;
          is_paid?: boolean;
          paid_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      teams: {
        Row: {
          id: string;
          event_id: string;
          team_name: string;
          members: string[];
          created_at: string;
        };
        Insert: { event_id: string; team_name: string; members: string[] };
        Update: { team_name?: string; members?: string[] };
        Relationships: [
          {
            foreignKeyName: "teams_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_slots_booked: {
        Args: { p_event_id: string; p_skill_level: string };
        Returns: void;
      };
      decrement_slots_booked: {
        Args: { p_event_id: string; p_skill_level: string };
        Returns: void;
      };
    };
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
