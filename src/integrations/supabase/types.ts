/**
 * Tipos TypeScript gerados do schema do Supabase.
 * 
 * Em produção, gere automaticamente com:
 *   npx supabase gen types typescript --project-id <SEU_PROJECT_ID> > src/integrations/supabase/types.ts
 * 
 * Os tipos abaixo refletem o schema definido no Módulo 3.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          name: string;
          email: string;
          business_name: string | null;
          description: string | null;
          address: string | null;
          phone: string | null;
          profile_image_url: string | null;
          custom_url_slug: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          email: string;
          business_name?: string | null;
          description?: string | null;
          address?: string | null;
          phone?: string | null;
          profile_image_url?: string | null;
          custom_url_slug?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          name?: string;
          email?: string;
          business_name?: string | null;
          description?: string | null;
          address?: string | null;
          phone?: string | null;
          profile_image_url?: string | null;
          custom_url_slug?: string | null;
          timezone?: string;
          updated_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          duration: number;
          price: number;
          type: "online" | "presencial";
          is_active: boolean;
          external_settings: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          duration: number;
          price: number;
          type: "online" | "presencial";
          is_active?: boolean;
          external_settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          duration?: number;
          price?: number;
          type?: "online" | "presencial";
          is_active?: boolean;
          external_settings?: Json | null;
          updated_at?: string;
        };
      };
      availability: {
        Row: {
          id: string;
          user_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      availability_exceptions: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          start_time: string | null;
          end_time: string | null;
          is_blocked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          start_time?: string | null;
          end_time?: string | null;
          is_blocked?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          start_time?: string | null;
          end_time?: string | null;
          is_blocked?: boolean;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          service_id: string;
          client_name: string;
          client_email: string;
          client_phone: string | null;
          client_notes: string | null;
          booking_date: string;
          booking_time: string;
          status: "pending" | "confirmed" | "cancelled" | "completed";
          google_event_id: string | null;
          meet_link: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          service_id: string;
          client_name: string;
          client_email: string;
          client_phone?: string | null;
          client_notes?: string | null;
          booking_date: string;
          booking_time: string;
          status?: "pending" | "confirmed" | "cancelled" | "completed";
          google_event_id?: string | null;
          meet_link?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          service_id?: string;
          client_name?: string;
          client_email?: string;
          client_phone?: string | null;
          client_notes?: string | null;
          booking_date?: string;
          booking_time?: string;
          status?: "pending" | "confirmed" | "cancelled" | "completed";
          google_event_id?: string | null;
          meet_link?: string | null;
          updated_at?: string;
        };
      };
      booking_emails: {
        Row: {
          id: string;
          booking_id: string;
          email_type: "confirmation" | "reminder_day_before" | "reminder_same_day";
          scheduled_at: string;
          status: "pending" | "sent" | "failed";
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          email_type: "confirmation" | "reminder_day_before" | "reminder_same_day";
          scheduled_at: string;
          status?: "pending" | "sent" | "failed";
          created_at?: string;
        };
        Update: {
          status?: "pending" | "sent" | "failed";
        };
      };
      booking_rate_limits: {
        Row: {
          id: string;
          ip_address: string;
          attempt_count: number;
          window_start: string;
        };
        Insert: {
          id?: string;
          ip_address: string;
          attempt_count?: number;
          window_start?: string;
        };
        Update: {
          attempt_count?: number;
          window_start?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          table_name: string;
          record_id: string;
          old_data: Json | null;
          new_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          table_name: string;
          record_id: string;
          old_data?: Json | null;
          new_data?: Json | null;
          created_at?: string;
        };
        Update: never;
      };
      app_settings: {
        Row: {
          id: string;
          user_id: string;
          min_advance_hours: number;
          max_advance_days: number;
          allow_same_day: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          min_advance_hours?: number;
          max_advance_days?: number;
          allow_same_day?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          min_advance_hours?: number;
          max_advance_days?: number;
          allow_same_day?: boolean;
          updated_at?: string;
        };
      };
    };
    Views: {
      public_services: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          duration: number;
          price: number;
          type: "online" | "presencial";
        };
      };
    };
    Functions: {
      store_google_token: {
        Args: {
          p_user_id: string;
          p_access_token: string;
          p_refresh_token: string;
        };
        Returns: void;
      };
      has_google_calendar_connected: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      disconnect_google_calendar: {
        Args: { p_user_id: string };
        Returns: void;
      };
    };
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled" | "completed";
      service_type: "online" | "presencial";
      email_type: "confirmation" | "reminder_day_before" | "reminder_same_day";
    };
  };
};

/* Tipos de conveniência — use em componentes */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Service = Database["public"]["Tables"]["services"]["Row"];
export type ServiceInsert = Database["public"]["Tables"]["services"]["Insert"];
export type ServiceUpdate = Database["public"]["Tables"]["services"]["Update"];

export type PublicService = Database["public"]["Views"]["public_services"]["Row"];

export type Availability = Database["public"]["Tables"]["availability"]["Row"];
export type AvailabilityException = Database["public"]["Tables"]["availability_exceptions"]["Row"];

export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
export type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];

export type AppSettings = Database["public"]["Tables"]["app_settings"]["Row"];

export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type ServiceType = Database["public"]["Enums"]["service_type"];
