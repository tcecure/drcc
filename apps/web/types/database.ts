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
          id: string;
          email: string;
          full_name: string;
          organization: string;
          phone: string | null;
          account_status: "pending" | "active" | "suspended" | "disabled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          organization?: string;
          phone?: string | null;
          account_status?: "pending" | "active" | "suspended" | "disabled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          organization?: string;
          phone?: string | null;
          account_status?: "pending" | "active" | "suspended" | "disabled";
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          id: string;
          role_name:
            | "student"
            | "approver"
            | "admin";
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          role_name: Database["public"]["Tables"]["roles"]["Row"]["role_name"];
          description?: string;
          created_at?: string;
        };
        Update: {
          role_name?: Database["public"]["Tables"]["roles"]["Row"]["role_name"];
          description?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          assigned_by: string | null;
          assigned_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          assigned_by?: string | null;
          assigned_at?: string;
          expires_at?: string | null;
        };
        Update: {
          assigned_by?: string | null;
          expires_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_events: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          previous_value: Json | null;
          new_value: Json | null;
          source_ip: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          previous_value?: Json | null;
          new_value?: Json | null;
          source_ip?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      access_requests: {
        Row: {
          id: string;
          user_id: string;
          request_type:
            | "cmmc_level_1_training"
            | "hands_on_lab"
            | "instructor_access"
            | "customer_delivery_zone"
            | "administrative_access";
          requested_program: string;
          reason: string;
          experience_level:
            | "beginner"
            | "intermediate"
            | "advanced"
            | "professional";
          school_or_organization: string;
          availability_notes: string | null;
          status:
            | "draft"
            | "submitted"
            | "under_review"
            | "more_information_required"
            | "approved"
            | "denied"
            | "withdrawn";
          reviewer_id: string | null;
          decision_notes: string | null;
          internal_notes: string | null;
          submitted_at: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          request_type: Database["public"]["Tables"]["access_requests"]["Row"]["request_type"];
          requested_program: string;
          reason: string;
          experience_level: Database["public"]["Tables"]["access_requests"]["Row"]["experience_level"];
          school_or_organization: string;
          availability_notes?: string | null;
          status?: Database["public"]["Tables"]["access_requests"]["Row"]["status"];
          reviewer_id?: string | null;
          decision_notes?: string | null;
          internal_notes?: string | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          request_type?: Database["public"]["Tables"]["access_requests"]["Row"]["request_type"];
          requested_program?: string;
          reason?: string;
          experience_level?: Database["public"]["Tables"]["access_requests"]["Row"]["experience_level"];
          school_or_organization?: string;
          availability_notes?: string | null;
          status?: Database["public"]["Tables"]["access_requests"]["Row"]["status"];
          reviewer_id?: string | null;
          decision_notes?: string | null;
          internal_notes?: string | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "access_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "access_requests_reviewer_id_fkey";
            columns: ["reviewer_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          notification_type: string;
          title: string;
          message: string;
          action_url: string | null;
          read_at: string | null;
          sent_email_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notification_type: string;
          title: string;
          message: string;
          action_url?: string | null;
          read_at?: string | null;
          sent_email_at?: string | null;
          created_at?: string;
        };
        Update: {
          read_at?: string | null;
          sent_email_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      email_jobs: {
        Row: {
          id: string;
          user_id: string | null;
          template_name: string;
          recipient: string;
          subject: string;
          payload: Json;
          rendered_text: string | null;
          rendered_html: string | null;
          status: "queued" | "sending" | "sent" | "failed" | "cancelled";
          attempts: number;
          error_message: string | null;
          requested_at: string;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          template_name: string;
          recipient: string;
          subject: string;
          payload?: Json;
          rendered_text?: string | null;
          rendered_html?: string | null;
          status?: Database["public"]["Tables"]["email_jobs"]["Row"]["status"];
          attempts?: number;
          error_message?: string | null;
          requested_at?: string;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string | null;
          template_name?: string;
          recipient?: string;
          subject?: string;
          payload?: Json;
          rendered_text?: string | null;
          rendered_html?: string | null;
          status?: Database["public"]["Tables"]["email_jobs"]["Row"]["status"];
          attempts?: number;
          error_message?: string | null;
          requested_at?: string;
          sent_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_jobs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      pre_registration_interests: {
        Row: {
          id: string;
          name: string;
          email: string;
          organization: string;
          interest:
            | "cmmc_level_1_training"
            | "hands_on_lab"
            | "student_resources"
            | "customer_delivery_zone";
          message: string;
          status: "new" | "contacted" | "converted" | "closed";
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          organization: string;
          interest: Database["public"]["Tables"]["pre_registration_interests"]["Row"]["interest"];
          message: string;
          status?: Database["public"]["Tables"]["pre_registration_interests"]["Row"]["status"];
          created_at?: string;
        };
        Update: {
          status?: Database["public"]["Tables"]["pre_registration_interests"]["Row"]["status"];
        };
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          resource_type:
            | "student_guide"
            | "lab_guide"
            | "video"
            | "policy"
            | "checklist"
            | "faq"
            | "troubleshooting"
            | "cmmc_reference"
            | "template"
            | "instructor_resource"
            | "customer_delivery_resource"
            | "announcement";
          program_area: string;
          audience: "public" | "student" | "approver" | "admin";
          required_role: "student" | "approver" | "admin" | null;
          lab_track_id: string | null;
          file_path: string | null;
          external_url: string | null;
          version: string;
          status: "draft" | "in_review" | "published" | "archived";
          effective_date: string | null;
          expiration_date: string | null;
          owner_id: string | null;
          reviewed_at: string | null;
          review_due_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description: string;
          resource_type: Database["public"]["Tables"]["resources"]["Row"]["resource_type"];
          program_area: string;
          audience?: Database["public"]["Tables"]["resources"]["Row"]["audience"];
          required_role?: Database["public"]["Tables"]["resources"]["Row"]["required_role"];
          lab_track_id?: string | null;
          file_path?: string | null;
          external_url?: string | null;
          version?: string;
          status?: Database["public"]["Tables"]["resources"]["Row"]["status"];
          effective_date?: string | null;
          expiration_date?: string | null;
          owner_id?: string | null;
          reviewed_at?: string | null;
          review_due_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          description?: string;
          resource_type?: Database["public"]["Tables"]["resources"]["Row"]["resource_type"];
          program_area?: string;
          audience?: Database["public"]["Tables"]["resources"]["Row"]["audience"];
          required_role?: Database["public"]["Tables"]["resources"]["Row"]["required_role"];
          lab_track_id?: string | null;
          file_path?: string | null;
          external_url?: string | null;
          version?: string;
          status?: Database["public"]["Tables"]["resources"]["Row"]["status"];
          effective_date?: string | null;
          expiration_date?: string | null;
          owner_id?: string | null;
          reviewed_at?: string | null;
          review_due_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resources_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      resource_tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      resource_tag_links: {
        Row: {
          resource_id: string;
          tag_id: string;
        };
        Insert: {
          resource_id: string;
          tag_id: string;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "resource_tag_links_resource_id_fkey";
            columns: ["resource_id"];
            isOneToOne: false;
            referencedRelation: "resources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resource_tag_links_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "resource_tags";
            referencedColumns: ["id"];
          },
        ];
      };
      moodle_courses: {
        Row: {
          id: string;
          moodle_course_id: number;
          course_name: string;
          course_short_name: string;
          description: string;
          required_for_lab: boolean;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          moodle_course_id: number;
          course_name: string;
          course_short_name: string;
          description?: string;
          required_for_lab?: boolean;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          moodle_course_id?: number;
          course_name?: string;
          course_short_name?: string;
          description?: string;
          required_for_lab?: boolean;
          active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      moodle_enrollments: {
        Row: {
          id: string;
          user_id: string;
          moodle_user_id: number | null;
          moodle_course_id: number;
          enrollment_status:
            | "pending"
            | "provisioning"
            | "enrolled"
            | "not_started"
            | "in_progress"
            | "completed"
            | "expired"
            | "suspended"
            | "failed";
          progress_percentage: number;
          enrolled_at: string | null;
          completed_at: string | null;
          last_activity_at: string | null;
          last_synced_at: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          moodle_user_id?: number | null;
          moodle_course_id: number;
          enrollment_status?: Database["public"]["Tables"]["moodle_enrollments"]["Row"]["enrollment_status"];
          progress_percentage?: number;
          enrolled_at?: string | null;
          completed_at?: string | null;
          last_activity_at?: string | null;
          last_synced_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          moodle_user_id?: number | null;
          moodle_course_id?: number;
          enrollment_status?: Database["public"]["Tables"]["moodle_enrollments"]["Row"]["enrollment_status"];
          progress_percentage?: number;
          enrolled_at?: string | null;
          completed_at?: string | null;
          last_activity_at?: string | null;
          last_synced_at?: string | null;
          error_message?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "moodle_enrollments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      integration_jobs: {
        Row: {
          id: string;
          integration_type: "moodle";
          job_type: string;
          user_id: string | null;
          entity_type: string;
          entity_id: string | null;
          payload: Json;
          status: "pending" | "running" | "completed" | "failed" | "retrying";
          external_job_id: string | null;
          attempts: number;
          error_message: string | null;
          requested_at: string;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          integration_type: "moodle";
          job_type: string;
          user_id?: string | null;
          entity_type: string;
          entity_id?: string | null;
          payload?: Json;
          status?: Database["public"]["Tables"]["integration_jobs"]["Row"]["status"];
          external_job_id?: string | null;
          attempts?: number;
          error_message?: string | null;
          requested_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          status?: Database["public"]["Tables"]["integration_jobs"]["Row"]["status"];
          external_job_id?: string | null;
          attempts?: number;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "integration_jobs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      lab_tracks: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          capacity: number;
          standard_duration_days: number;
          prerequisite_course_id: number | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          capacity?: number;
          standard_duration_days?: number;
          prerequisite_course_id?: number | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string;
          capacity?: number;
          standard_duration_days?: number;
          prerequisite_course_id?: number | null;
          active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      lab_requests: {
        Row: {
          id: string;
          user_id: string;
          lab_track_id: string;
          preferred_start_date: string | null;
          weekly_availability: string;
          experience_level: "beginner" | "intermediate" | "advanced" | "professional";
          accessibility_needs: string | null;
          acceptable_use_accepted_at: string | null;
          connectivity_confirmed_at: string | null;
          eligibility_verified: boolean;
          status:
            | "draft"
            | "submitted"
            | "ineligible"
            | "queued"
            | "on_hold"
            | "withdrawn"
            | "reserved"
            | "provisioning"
            | "active"
            | "completed"
            | "expired"
            | "revoked";
          requested_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lab_track_id: string;
          preferred_start_date?: string | null;
          weekly_availability: string;
          experience_level: Database["public"]["Tables"]["lab_requests"]["Row"]["experience_level"];
          accessibility_needs?: string | null;
          acceptable_use_accepted_at?: string | null;
          connectivity_confirmed_at?: string | null;
          eligibility_verified?: boolean;
          status?: Database["public"]["Tables"]["lab_requests"]["Row"]["status"];
          requested_at?: string | null;
          updated_at?: string;
        };
        Update: {
          lab_track_id?: string;
          preferred_start_date?: string | null;
          weekly_availability?: string;
          experience_level?: Database["public"]["Tables"]["lab_requests"]["Row"]["experience_level"];
          accessibility_needs?: string | null;
          acceptable_use_accepted_at?: string | null;
          connectivity_confirmed_at?: string | null;
          eligibility_verified?: boolean;
          status?: Database["public"]["Tables"]["lab_requests"]["Row"]["status"];
          requested_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lab_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lab_requests_lab_track_id_fkey";
            columns: ["lab_track_id"];
            isOneToOne: false;
            referencedRelation: "lab_tracks";
            referencedColumns: ["id"];
          },
        ];
      };
      lab_queue_entries: {
        Row: {
          id: string;
          lab_request_id: string;
          user_id: string;
          lab_track_id: string;
          priority_group: number;
          queue_status:
            | "waiting"
            | "readiness_requested"
            | "ready"
            | "reservation_offered"
            | "reserved"
            | "provisioning"
            | "active"
            | "paused"
            | "removed"
            | "completed";
          eligibility_date: string;
          request_date: string;
          ready_confirmed_at: string | null;
          confirmation_expires_at: string | null;
          reserved_at: string | null;
          assigned_lab_instance_id: string | null;
          manual_priority: number;
          override_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lab_request_id: string;
          user_id: string;
          lab_track_id: string;
          priority_group?: number;
          queue_status?: Database["public"]["Tables"]["lab_queue_entries"]["Row"]["queue_status"];
          eligibility_date?: string;
          request_date?: string;
          ready_confirmed_at?: string | null;
          confirmation_expires_at?: string | null;
          reserved_at?: string | null;
          assigned_lab_instance_id?: string | null;
          manual_priority?: number;
          override_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          priority_group?: number;
          queue_status?: Database["public"]["Tables"]["lab_queue_entries"]["Row"]["queue_status"];
          ready_confirmed_at?: string | null;
          confirmation_expires_at?: string | null;
          reserved_at?: string | null;
          assigned_lab_instance_id?: string | null;
          manual_priority?: number;
          override_reason?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lab_queue_entries_lab_request_id_fkey";
            columns: ["lab_request_id"];
            isOneToOne: true;
            referencedRelation: "lab_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lab_queue_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lab_queue_entries_lab_track_id_fkey";
            columns: ["lab_track_id"];
            isOneToOne: false;
            referencedRelation: "lab_tracks";
            referencedColumns: ["id"];
          },
        ];
      };
      lab_instances: {
        Row: {
          id: string;
          lab_track_id: string;
          pod_name: string;
          environment_identifier: string;
          status: "available" | "reserved" | "provisioning" | "active" | "expiring" | "resetting" | "maintenance" | "disabled";
          assigned_user_id: string | null;
          assigned_at: string | null;
          expires_at: string | null;
          last_reset_at: string | null;
          maintenance_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lab_track_id: string;
          pod_name: string;
          environment_identifier: string;
          status?: Database["public"]["Tables"]["lab_instances"]["Row"]["status"];
          assigned_user_id?: string | null;
          assigned_at?: string | null;
          expires_at?: string | null;
          last_reset_at?: string | null;
          maintenance_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          lab_track_id?: string;
          pod_name?: string;
          environment_identifier?: string;
          status?: Database["public"]["Tables"]["lab_instances"]["Row"]["status"];
          assigned_user_id?: string | null;
          assigned_at?: string | null;
          expires_at?: string | null;
          last_reset_at?: string | null;
          maintenance_notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      lab_assignments: {
        Row: {
          id: string;
          user_id: string;
          lab_instance_id: string;
          queue_entry_id: string;
          status: "reservation_offered" | "reserved" | "declined" | "provisioning" | "active" | "completed" | "expired" | "revoked";
          reserved_at: string | null;
          starts_at: string | null;
          expires_at: string | null;
          extended_until: string | null;
          completed_at: string | null;
          revoked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lab_instance_id: string;
          queue_entry_id: string;
          status?: Database["public"]["Tables"]["lab_assignments"]["Row"]["status"];
          reserved_at?: string | null;
          starts_at?: string | null;
          expires_at?: string | null;
          extended_until?: string | null;
          completed_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: Database["public"]["Tables"]["lab_assignments"]["Row"]["status"];
          reserved_at?: string | null;
          starts_at?: string | null;
          expires_at?: string | null;
          extended_until?: string | null;
          completed_at?: string | null;
          revoked_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      lab_capacity_settings: {
        Row: {
          id: string;
          lab_track_id: string | null;
          maximum_active: number;
          maximum_reserved: number;
          confirmation_window_hours: number;
          inactivity_warning_hours: number;
          standard_duration_days: number;
          maximum_extension_days: number;
          automatic_expiration_enabled: boolean;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lab_track_id?: string | null;
          maximum_active?: number;
          maximum_reserved?: number;
          confirmation_window_hours?: number;
          inactivity_warning_hours?: number;
          standard_duration_days?: number;
          maximum_extension_days?: number;
          automatic_expiration_enabled?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          lab_track_id?: string | null;
          maximum_active?: number;
          maximum_reserved?: number;
          confirmation_window_hours?: number;
          inactivity_warning_hours?: number;
          standard_duration_days?: number;
          maximum_extension_days?: number;
          automatic_expiration_enabled?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_has_role: {
        Args: { required_role: string };
        Returns: boolean;
      };
      current_user_has_any_role: {
        Args: { required_roles: string[] };
        Returns: boolean;
      };
      user_completed_required_moodle_training: {
        Args: { check_user_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
