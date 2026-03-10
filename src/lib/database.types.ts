export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      belrai_answers: {
        Row: {
          assessment_id: string
          confidence: number
          created_at: string
          evidence_summary: string | null
          id: string
          is_confirmed: boolean
          is_suggested: boolean
          item_code: string
          item_id: string
          item_label: string
          metadata: Json
          observed_at: string | null
          observed_by: string | null
          response_label: string | null
          response_value: number | null
          section_id: string
          source: Database["public"]["Enums"]["belrai_evidence_source"]
          updated_at: string
        }
        Insert: {
          assessment_id: string
          confidence?: number
          created_at?: string
          evidence_summary?: string | null
          id?: string
          is_confirmed?: boolean
          is_suggested?: boolean
          item_code: string
          item_id: string
          item_label: string
          metadata?: Json
          observed_at?: string | null
          observed_by?: string | null
          response_label?: string | null
          response_value?: number | null
          section_id: string
          source?: Database["public"]["Enums"]["belrai_evidence_source"]
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          confidence?: number
          created_at?: string
          evidence_summary?: string | null
          id?: string
          is_confirmed?: boolean
          is_suggested?: boolean
          item_code?: string
          item_id?: string
          item_label?: string
          metadata?: Json
          observed_at?: string | null
          observed_by?: string | null
          response_label?: string | null
          response_value?: number | null
          section_id?: string
          source?: Database["public"]["Enums"]["belrai_evidence_source"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "belrai_answers_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "belrai_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belrai_answers_observed_by_fkey"
            columns: ["observed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      belrai_assessments: {
        Row: {
          assessment_scope: string
          completed_at: string | null
          created_at: string
          id: string
          last_synced_at: string | null
          next_due_at: string | null
          patient_id: string
          review_note: string | null
          reviewed_by: string | null
          source: string
          started_by: string | null
          status: Database["public"]["Enums"]["belrai_assessment_status"]
          submitted_at: string | null
          summary: Json
          sync_status: Database["public"]["Enums"]["belrai_sync_status"]
          template_id: string | null
          template_key: string
          template_version: string
          updated_at: string
        }
        Insert: {
          assessment_scope?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          last_synced_at?: string | null
          next_due_at?: string | null
          patient_id: string
          review_note?: string | null
          reviewed_by?: string | null
          source?: string
          started_by?: string | null
          status?: Database["public"]["Enums"]["belrai_assessment_status"]
          submitted_at?: string | null
          summary?: Json
          sync_status?: Database["public"]["Enums"]["belrai_sync_status"]
          template_id?: string | null
          template_key?: string
          template_version?: string
          updated_at?: string
        }
        Update: {
          assessment_scope?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          last_synced_at?: string | null
          next_due_at?: string | null
          patient_id?: string
          review_note?: string | null
          reviewed_by?: string | null
          source?: string
          started_by?: string | null
          status?: Database["public"]["Enums"]["belrai_assessment_status"]
          submitted_at?: string | null
          summary?: Json
          sync_status?: Database["public"]["Enums"]["belrai_sync_status"]
          template_id?: string | null
          template_key?: string
          template_version?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "belrai_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belrai_assessments_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belrai_assessments_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belrai_assessments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "belrai_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      belrai_caps: {
        Row: {
          assessment_id: string
          cap_key: string
          created_at: string
          detail: string
          id: string
          metadata: Json
          priority: Database["public"]["Enums"]["belrai_priority"]
          rationale: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          cap_key: string
          created_at?: string
          detail?: string
          id?: string
          metadata?: Json
          priority?: Database["public"]["Enums"]["belrai_priority"]
          rationale?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          cap_key?: string
          created_at?: string
          detail?: string
          id?: string
          metadata?: Json
          priority?: Database["public"]["Enums"]["belrai_priority"]
          rationale?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "belrai_caps_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "belrai_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      belrai_evidence_links: {
        Row: {
          answer_id: string | null
          assessment_id: string
          created_at: string
          id: string
          item_id: string
          label: string
          metadata: Json
          observed_at: string | null
          source: Database["public"]["Enums"]["belrai_evidence_source"]
          source_ref: string | null
          summary: string
        }
        Insert: {
          answer_id?: string | null
          assessment_id: string
          created_at?: string
          id?: string
          item_id: string
          label: string
          metadata?: Json
          observed_at?: string | null
          source: Database["public"]["Enums"]["belrai_evidence_source"]
          source_ref?: string | null
          summary: string
        }
        Update: {
          answer_id?: string | null
          assessment_id?: string
          created_at?: string
          id?: string
          item_id?: string
          label?: string
          metadata?: Json
          observed_at?: string | null
          source?: Database["public"]["Enums"]["belrai_evidence_source"]
          source_ref?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "belrai_evidence_links_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "belrai_answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belrai_evidence_links_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "belrai_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      belrai_items: {
        Row: {
          created_at: string
          description: string
          display_order: number
          id: string
          item_code: string
          item_key: string
          label: string
          metadata: Json
          options: Json
          section_key: string
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          item_code: string
          item_key: string
          label: string
          metadata?: Json
          options?: Json
          section_key: string
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          item_code?: string
          item_key?: string
          label?: string
          metadata?: Json
          options?: Json
          section_key?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "belrai_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "belrai_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      belrai_participants: {
        Row: {
          assessment_id: string
          created_at: string
          display_name: string
          id: string
          last_contribution_at: string | null
          participant_role: string
          profile_id: string | null
          status: Database["public"]["Enums"]["belrai_participant_status"]
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          display_name: string
          id?: string
          last_contribution_at?: string | null
          participant_role: string
          profile_id?: string | null
          status?: Database["public"]["Enums"]["belrai_participant_status"]
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          display_name?: string
          id?: string
          last_contribution_at?: string | null
          participant_role?: string
          profile_id?: string | null
          status?: Database["public"]["Enums"]["belrai_participant_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "belrai_participants_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "belrai_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belrai_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      belrai_reports: {
        Row: {
          assessment_id: string
          created_at: string
          generated_at: string
          id: string
          payload: Json
          report_type: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          generated_at?: string
          id?: string
          payload?: Json
          report_type: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          generated_at?: string
          id?: string
          payload?: Json
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "belrai_reports_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "belrai_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      belrai_scores: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          interpretation: string | null
          label: string
          metadata: Json
          score_key: string
          tone: string
          updated_at: string
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          interpretation?: string | null
          label: string
          metadata?: Json
          score_key: string
          tone?: string
          updated_at?: string
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          interpretation?: string | null
          label?: string
          metadata?: Json
          score_key?: string
          tone?: string
          updated_at?: string
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "belrai_scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "belrai_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      belrai_sync_jobs: {
        Row: {
          assessment_id: string
          created_at: string
          error_message: string | null
          id: string
          processed_at: string | null
          request_payload: Json
          requested_at: string
          response_payload: Json
          status: Database["public"]["Enums"]["belrai_sync_status"]
          target: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          request_payload?: Json
          requested_at?: string
          response_payload?: Json
          status?: Database["public"]["Enums"]["belrai_sync_status"]
          target?: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          request_payload?: Json
          requested_at?: string
          response_payload?: Json
          status?: Database["public"]["Enums"]["belrai_sync_status"]
          target?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "belrai_sync_jobs_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "belrai_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      belrai_templates: {
        Row: {
          assessment_scope: string
          created_at: string
          definition: Json
          id: string
          is_active: boolean
          label: string
          template_key: string
          updated_at: string
          version: string
        }
        Insert: {
          assessment_scope?: string
          created_at?: string
          definition?: Json
          id?: string
          is_active?: boolean
          label: string
          template_key: string
          updated_at?: string
          version: string
        }
        Update: {
          assessment_scope?: string
          created_at?: string
          definition?: Json
          id?: string
          is_active?: boolean
          label?: string
          template_key?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      dashboard_sections: {
        Row: {
          created_at: string
          id: string
          payload: Json
          scope: Database["public"]["Enums"]["dashboard_scope"]
          section_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          scope: Database["public"]["Enums"]["dashboard_scope"]
          section_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          scope?: Database["public"]["Enums"]["dashboard_scope"]
          section_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_access_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: Database["public"]["Enums"]["user_role"] | null
          contains_pii: boolean
          created_at: string
          id: string
          ip_hint: string | null
          metadata: Json
          patient_id: string | null
          record_id: string | null
          resource_label: string
          severity: string
          system_generated: boolean
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          contains_pii?: boolean
          created_at?: string
          id?: string
          ip_hint?: string | null
          metadata?: Json
          patient_id?: string | null
          record_id?: string | null
          resource_label?: string
          severity?: string
          system_generated?: boolean
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          contains_pii?: boolean
          created_at?: string
          id?: string
          ip_hint?: string | null
          metadata?: Json
          patient_id?: string | null
          record_id?: string | null
          resource_label?: string
          severity?: string
          system_generated?: boolean
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_access_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_access_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      eagreement_requests: {
        Row: {
          belrai_assessment_id: string | null
          care_type: string
          created_at: string
          created_by_profile_id: string | null
          decided_at: string | null
          end_at: string
          had_episode_id: string | null
          id: string
          katz_category: Database["public"]["Enums"]["katz_category"] | null
          mycarenet_reference: string | null
          nomenclature: string
          patient_id: string
          prescriber_name: string
          rejection_reason: string | null
          required_attachments: Json
          reviewed_by_profile_id: string | null
          start_at: string
          status: string
          submitted_at: string | null
          supporting_context: Json
          updated_at: string
        }
        Insert: {
          belrai_assessment_id?: string | null
          care_type: string
          created_at?: string
          created_by_profile_id?: string | null
          decided_at?: string | null
          end_at: string
          had_episode_id?: string | null
          id?: string
          katz_category?: Database["public"]["Enums"]["katz_category"] | null
          mycarenet_reference?: string | null
          nomenclature: string
          patient_id: string
          prescriber_name?: string
          rejection_reason?: string | null
          required_attachments?: Json
          reviewed_by_profile_id?: string | null
          start_at: string
          status?: string
          submitted_at?: string | null
          supporting_context?: Json
          updated_at?: string
        }
        Update: {
          belrai_assessment_id?: string | null
          care_type?: string
          created_at?: string
          created_by_profile_id?: string | null
          decided_at?: string | null
          end_at?: string
          had_episode_id?: string | null
          id?: string
          katz_category?: Database["public"]["Enums"]["katz_category"] | null
          mycarenet_reference?: string | null
          nomenclature?: string
          patient_id?: string
          prescriber_name?: string
          rejection_reason?: string | null
          required_attachments?: Json
          reviewed_by_profile_id?: string | null
          start_at?: string
          status?: string
          submitted_at?: string | null
          supporting_context?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eagreement_requests_belrai_assessment_id_fkey"
            columns: ["belrai_assessment_id"]
            isOneToOne: false
            referencedRelation: "belrai_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eagreement_requests_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eagreement_requests_had_episode_id_fkey"
            columns: ["had_episode_id"]
            isOneToOne: false
            referencedRelation: "had_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eagreement_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eagreement_requests_reviewed_by_profile_id_fkey"
            columns: ["reviewed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      had_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          assigned_to_profile_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          episode_id: string
          id: string
          measurement_id: string | null
          resolution_note: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          assigned_to_profile_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          episode_id: string
          id?: string
          measurement_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          severity: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          assigned_to_profile_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          episode_id?: string
          id?: string
          measurement_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "had_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_alerts_assigned_to_profile_id_fkey"
            columns: ["assigned_to_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_alerts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_alerts_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "had_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_alerts_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "had_measurements"
            referencedColumns: ["id"]
          },
        ]
      }
      had_care_plans: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          discharge_criteria: Json
          episode_id: string
          escalation_rules: Json
          id: string
          monitoring_plan: Json
          next_review_at: string | null
          protocol_slug: string
          review_frequency_hours: number
          status: string
          summary: string
          updated_at: string
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          discharge_criteria?: Json
          episode_id: string
          escalation_rules?: Json
          id?: string
          monitoring_plan?: Json
          next_review_at?: string | null
          protocol_slug: string
          review_frequency_hours?: number
          status?: string
          summary?: string
          updated_at?: string
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          discharge_criteria?: Json
          episode_id?: string
          escalation_rules?: Json
          id?: string
          monitoring_plan?: Json
          next_review_at?: string | null
          protocol_slug?: string
          review_frequency_hours?: number
          status?: string
          summary?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "had_care_plans_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_care_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_care_plans_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "had_episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      ehealth_consent_sync_logs: {
        Row: {
          created_at: string
          error_detail: string | null
          id: string
          patient_id: string
          payload: Json
          response_code: string | null
          source: string
          status: string
          sync_type: string
          synced_at: string
        }
        Insert: {
          created_at?: string
          error_detail?: string | null
          id?: string
          patient_id: string
          payload?: Json
          response_code?: string | null
          source?: string
          status?: string
          sync_type?: string
          synced_at?: string
        }
        Update: {
          created_at?: string
          error_detail?: string | null
          id?: string
          patient_id?: string
          payload?: Json
          response_code?: string | null
          source?: string
          status?: string
          sync_type?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ehealth_consent_sync_logs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      had_eligibility_assessments: {
        Row: {
          assessed_at: string
          assessed_by: string | null
          blockers: Json
          caregiver_available: boolean | null
          caregiver_burden_risk: boolean
          clinical_stability: boolean
          created_at: string
          episode_id: string
          gp_informed: boolean
          home_environment_adequate: boolean
          id: string
          logistics_ready: boolean
          needs_immediate_technical_platform: boolean
          notes: string | null
          patient_consent_obtained: boolean
          recommendations: Json
          requires_24_7_monitoring: boolean
          result: Database["public"]["Enums"]["had_eligibility_result"]
          updated_at: string
        }
        Insert: {
          assessed_at?: string
          assessed_by?: string | null
          blockers?: Json
          caregiver_available?: boolean | null
          caregiver_burden_risk?: boolean
          clinical_stability?: boolean
          created_at?: string
          episode_id: string
          gp_informed?: boolean
          home_environment_adequate?: boolean
          id?: string
          logistics_ready?: boolean
          needs_immediate_technical_platform?: boolean
          notes?: string | null
          patient_consent_obtained?: boolean
          recommendations?: Json
          requires_24_7_monitoring?: boolean
          result: Database["public"]["Enums"]["had_eligibility_result"]
          updated_at?: string
        }
        Update: {
          assessed_at?: string
          assessed_by?: string | null
          blockers?: Json
          caregiver_available?: boolean | null
          caregiver_burden_risk?: boolean
          clinical_stability?: boolean
          created_at?: string
          episode_id?: string
          gp_informed?: boolean
          home_environment_adequate?: boolean
          id?: string
          logistics_ready?: boolean
          needs_immediate_technical_platform?: boolean
          notes?: string | null
          patient_consent_obtained?: boolean
          recommendations?: Json
          requires_24_7_monitoring?: boolean
          result?: Database["public"]["Enums"]["had_eligibility_result"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "had_eligibility_assessments_assessed_by_fkey"
            columns: ["assessed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_eligibility_assessments_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "had_episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      had_episode_team_members: {
        Row: {
          created_at: string
          episode_id: string
          external_email: string | null
          external_name: string | null
          external_phone: string | null
          id: string
          is_primary: boolean
          profile_id: string | null
          receives_alerts: boolean
          role: Database["public"]["Enums"]["had_team_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          episode_id: string
          external_email?: string | null
          external_name?: string | null
          external_phone?: string | null
          id?: string
          is_primary?: boolean
          profile_id?: string | null
          receives_alerts?: boolean
          role: Database["public"]["Enums"]["had_team_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          episode_id?: string
          external_email?: string | null
          external_name?: string | null
          external_phone?: string | null
          id?: string
          is_primary?: boolean
          profile_id?: string | null
          receives_alerts?: boolean
          role?: Database["public"]["Enums"]["had_team_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "had_episode_team_members_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "had_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_episode_team_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      had_episodes: {
        Row: {
          admission_reason: string
          caregiver_available: boolean | null
          caregiver_required: boolean
          consent_confirmed: boolean
          coordinator_profile_id: string | null
          created_at: string
          created_by: string | null
          diagnosis_summary: string
          discharge_summary: string | null
          end_at: string | null
          episode_type: Database["public"]["Enums"]["had_episode_type"]
          escalated_at: string | null
          escalation_reason: string | null
          exclusion_notes: string | null
          home_ready: boolean
          hospital_reference: string | null
          id: string
          inclusion_notes: string | null
          last_round_at: string | null
          origin: string
          originating_hospital: string
          originating_service: string | null
          patient_id: string
          primary_nurse_profile_id: string | null
          reference: string
          risk_level: string
          source_visit_id: string | null
          specialist_profile_id: string | null
          start_at: string | null
          status: Database["public"]["Enums"]["had_episode_status"]
          target_end_at: string | null
          updated_at: string
        }
        Insert: {
          admission_reason?: string
          caregiver_available?: boolean | null
          caregiver_required?: boolean
          consent_confirmed?: boolean
          coordinator_profile_id?: string | null
          created_at?: string
          created_by?: string | null
          diagnosis_summary?: string
          discharge_summary?: string | null
          end_at?: string | null
          episode_type: Database["public"]["Enums"]["had_episode_type"]
          escalated_at?: string | null
          escalation_reason?: string | null
          exclusion_notes?: string | null
          home_ready?: boolean
          hospital_reference?: string | null
          id?: string
          inclusion_notes?: string | null
          last_round_at?: string | null
          origin?: string
          originating_hospital?: string
          originating_service?: string | null
          patient_id: string
          primary_nurse_profile_id?: string | null
          reference?: string
          risk_level?: string
          source_visit_id?: string | null
          specialist_profile_id?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["had_episode_status"]
          target_end_at?: string | null
          updated_at?: string
        }
        Update: {
          admission_reason?: string
          caregiver_available?: boolean | null
          caregiver_required?: boolean
          consent_confirmed?: boolean
          coordinator_profile_id?: string | null
          created_at?: string
          created_by?: string | null
          diagnosis_summary?: string
          discharge_summary?: string | null
          end_at?: string | null
          episode_type?: Database["public"]["Enums"]["had_episode_type"]
          escalated_at?: string | null
          escalation_reason?: string | null
          exclusion_notes?: string | null
          home_ready?: boolean
          hospital_reference?: string | null
          id?: string
          inclusion_notes?: string | null
          last_round_at?: string | null
          origin?: string
          originating_hospital?: string
          originating_service?: string | null
          patient_id?: string
          primary_nurse_profile_id?: string | null
          reference?: string
          risk_level?: string
          source_visit_id?: string | null
          specialist_profile_id?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["had_episode_status"]
          target_end_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "had_episodes_coordinator_profile_id_fkey"
            columns: ["coordinator_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_episodes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_episodes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_episodes_primary_nurse_profile_id_fkey"
            columns: ["primary_nurse_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_episodes_source_visit_id_fkey"
            columns: ["source_visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_episodes_specialist_profile_id_fkey"
            columns: ["specialist_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      had_logistics_items: {
        Row: {
          cold_chain_required: boolean
          completed_at: string | null
          created_at: string
          episode_id: string
          id: string
          item_type: string
          label: string
          notes: string | null
          quantity: number | null
          scheduled_for: string | null
          status: string
          supplier: string | null
          tracking_reference: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          cold_chain_required?: boolean
          completed_at?: string | null
          created_at?: string
          episode_id: string
          id?: string
          item_type: string
          label: string
          notes?: string | null
          quantity?: number | null
          scheduled_for?: string | null
          status?: string
          supplier?: string | null
          tracking_reference?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          cold_chain_required?: boolean
          completed_at?: string | null
          created_at?: string
          episode_id?: string
          id?: string
          item_type?: string
          label?: string
          notes?: string | null
          quantity?: number | null
          scheduled_for?: string | null
          status?: string
          supplier?: string | null
          tracking_reference?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "had_logistics_items_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "had_episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      had_measurements: {
        Row: {
          captured_by_profile_id: string | null
          created_at: string
          episode_id: string
          id: string
          measurement_type: string
          notes: string | null
          recorded_at: string
          source: Database["public"]["Enums"]["had_measurement_source"]
          threshold_state: string
          unit: string
          updated_at: string
          value_numeric: number | null
          value_text: string | null
          visit_id: string | null
        }
        Insert: {
          captured_by_profile_id?: string | null
          created_at?: string
          episode_id: string
          id?: string
          measurement_type: string
          notes?: string | null
          recorded_at?: string
          source: Database["public"]["Enums"]["had_measurement_source"]
          threshold_state?: string
          unit?: string
          updated_at?: string
          value_numeric?: number | null
          value_text?: string | null
          visit_id?: string | null
        }
        Update: {
          captured_by_profile_id?: string | null
          created_at?: string
          episode_id?: string
          id?: string
          measurement_type?: string
          notes?: string | null
          recorded_at?: string
          source?: Database["public"]["Enums"]["had_measurement_source"]
          threshold_state?: string
          unit?: string
          updated_at?: string
          value_numeric?: number | null
          value_text?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "had_measurements_captured_by_profile_id_fkey"
            columns: ["captured_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_measurements_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "had_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_measurements_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      had_medication_orders: {
        Row: {
          administration_instructions: string | null
          care_plan_id: string | null
          created_at: string
          dose: string
          end_at: string | null
          episode_id: string
          frequency: string
          id: string
          last_administered_at: string | null
          line_number: number
          medication_name: string
          next_due_at: string | null
          requires_nurse: boolean
          route: string
          start_at: string | null
          status: string
          supplier: string
          updated_at: string
        }
        Insert: {
          administration_instructions?: string | null
          care_plan_id?: string | null
          created_at?: string
          dose?: string
          end_at?: string | null
          episode_id: string
          frequency?: string
          id?: string
          last_administered_at?: string | null
          line_number?: number
          medication_name: string
          next_due_at?: string | null
          requires_nurse?: boolean
          route?: string
          start_at?: string | null
          status?: string
          supplier?: string
          updated_at?: string
        }
        Update: {
          administration_instructions?: string | null
          care_plan_id?: string | null
          created_at?: string
          dose?: string
          end_at?: string | null
          episode_id?: string
          frequency?: string
          id?: string
          last_administered_at?: string | null
          line_number?: number
          medication_name?: string
          next_due_at?: string | null
          requires_nurse?: boolean
          route?: string
          start_at?: string | null
          status?: string
          supplier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "had_medication_orders_care_plan_id_fkey"
            columns: ["care_plan_id"]
            isOneToOne: false
            referencedRelation: "had_care_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_medication_orders_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "had_episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      had_rounds: {
        Row: {
          created_at: string
          decision: Database["public"]["Enums"]["had_round_decision"]
          decision_reason: string | null
          episode_id: string
          id: string
          next_round_at: string | null
          overnight_events: string | null
          recommendation: string | null
          recorded_by: string | null
          risk_score: number | null
          round_at: string
          summary: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decision?: Database["public"]["Enums"]["had_round_decision"]
          decision_reason?: string | null
          episode_id: string
          id?: string
          next_round_at?: string | null
          overnight_events?: string | null
          recommendation?: string | null
          recorded_by?: string | null
          risk_score?: number | null
          round_at?: string
          summary?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decision?: Database["public"]["Enums"]["had_round_decision"]
          decision_reason?: string | null
          episode_id?: string
          id?: string
          next_round_at?: string | null
          overnight_events?: string | null
          recommendation?: string | null
          recorded_by?: string | null
          risk_score?: number | null
          round_at?: string
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "had_rounds_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "had_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_rounds_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      had_tasks: {
        Row: {
          completed_at: string | null
          completed_by_profile_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          episode_id: string
          id: string
          linked_alert_id: string | null
          owner_external_label: string | null
          owner_kind: string
          owner_profile_id: string | null
          status: string
          task_type: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          completed_at?: string | null
          completed_by_profile_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          episode_id: string
          id?: string
          linked_alert_id?: string | null
          owner_external_label?: string | null
          owner_kind: string
          owner_profile_id?: string | null
          status?: string
          task_type: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          completed_at?: string | null
          completed_by_profile_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          episode_id?: string
          id?: string
          linked_alert_id?: string | null
          owner_external_label?: string | null
          owner_kind?: string
          owner_profile_id?: string | null
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "had_tasks_completed_by_profile_id_fkey"
            columns: ["completed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_tasks_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "had_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_tasks_linked_alert_id_fkey"
            columns: ["linked_alert_id"]
            isOneToOne: false
            referencedRelation: "had_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "had_tasks_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_reminders: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          patient_id: string
          scheduled_for: string
          status: string
          taken_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          patient_id: string
          scheduled_for: string
          status: string
          taken_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          patient_id?: string
          scheduled_for?: string
          status?: string
          taken_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_reminders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_allergies: {
        Row: {
          created_at: string
          id: string
          label: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          patient_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_allergies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_assignments: {
        Row: {
          assignment_role: Database["public"]["Enums"]["user_role"]
          created_at: string
          id: string
          is_primary: boolean
          patient_id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          assignment_role: Database["public"]["Enums"]["user_role"]
          created_at?: string
          id?: string
          is_primary?: boolean
          patient_id: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          assignment_role?: Database["public"]["Enums"]["user_role"]
          created_at?: string
          id?: string
          is_primary?: boolean
          patient_id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_assignments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_consents: {
        Row: {
          consent_status: string
          created_at: string
          exclusion_note: string
          id: string
          last_sync_at: string | null
          patient_id: string
          source: string
          therapeutic_link_status: string
          updated_at: string
        }
        Insert: {
          consent_status: string
          created_at?: string
          exclusion_note?: string
          id?: string
          last_sync_at?: string | null
          patient_id: string
          source?: string
          therapeutic_link_status: string
          updated_at?: string
        }
        Update: {
          consent_status?: string
          created_at?: string
          exclusion_note?: string
          id?: string
          last_sync_at?: string | null
          patient_id?: string
          source?: string
          therapeutic_link_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_dashboard_state: {
        Row: {
          assigned_nurse_id: string | null
          created_at: string
          eta_minutes: number
          eta_status: string
          health_tip: string
          nurse_name: string
          patient_id: string
          updated_at: string
          visits_today: number
        }
        Insert: {
          assigned_nurse_id?: string | null
          created_at?: string
          eta_minutes?: number
          eta_status?: string
          health_tip?: string
          nurse_name?: string
          patient_id: string
          updated_at?: string
          visits_today?: number
        }
        Update: {
          assigned_nurse_id?: string | null
          created_at?: string
          eta_minutes?: number
          eta_status?: string
          health_tip?: string
          nurse_name?: string
          patient_id?: string
          updated_at?: string
          visits_today?: number
        }
        Relationships: [
          {
            foreignKeyName: "patient_dashboard_state_assigned_nurse_id_fkey"
            columns: ["assigned_nurse_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_dashboard_state_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: true
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_pathologies: {
        Row: {
          created_at: string
          id: string
          label: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          patient_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_pathologies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_timeline_events: {
        Row: {
          created_at: string
          display_order: number
          event_time: string
          id: string
          label: string
          patient_id: string
          related_visit_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          event_time: string
          id?: string
          label: string
          patient_id: string
          related_visit_id?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          event_time?: string
          id?: string
          label?: string
          patient_id?: string
          related_visit_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_timeline_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_timeline_events_related_visit_id_fkey"
            columns: ["related_visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_vital_snapshots: {
        Row: {
          created_at: string
          display_order: number
          id: string
          label: string
          patient_id: string
          recorded_at: string
          tone: string
          unit: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          label: string
          patient_id: string
          recorded_at?: string
          tone: string
          unit: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          label?: string
          patient_id?: string
          recorded_at?: string
          tone?: string
          unit?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_vital_snapshots_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          city: string
          created_at: string
          date_of_birth: string | null
          doctor_phone: string | null
          email: string | null
          first_name: string
          gender: Database["public"]["Enums"]["patient_gender"] | null
          house_number: string
          id: string
          is_active: boolean
          katz_category: Database["public"]["Enums"]["katz_category"] | null
          katz_score: number | null
          last_name: string
          last_visit_at: string | null
          lat: number | null
          lng: number | null
          mutuality: string
          mutuality_number: string
          next_visit_at: string | null
          niss: string | null
          notes: string | null
          phone: string
          photo_url: string | null
          postal_code: string
          prescribing_doctor: string
          profile_id: string | null
          street: string
          updated_at: string
        }
        Insert: {
          city?: string
          created_at?: string
          date_of_birth?: string | null
          doctor_phone?: string | null
          email?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["patient_gender"] | null
          house_number?: string
          id?: string
          is_active?: boolean
          katz_category?: Database["public"]["Enums"]["katz_category"] | null
          katz_score?: number | null
          last_name?: string
          last_visit_at?: string | null
          lat?: number | null
          lng?: number | null
          mutuality?: string
          mutuality_number?: string
          next_visit_at?: string | null
          niss?: string | null
          notes?: string | null
          phone?: string
          photo_url?: string | null
          postal_code?: string
          prescribing_doctor?: string
          profile_id?: string | null
          street?: string
          updated_at?: string
        }
        Update: {
          city?: string
          created_at?: string
          date_of_birth?: string | null
          doctor_phone?: string | null
          email?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["patient_gender"] | null
          house_number?: string
          id?: string
          is_active?: boolean
          katz_category?: Database["public"]["Enums"]["katz_category"] | null
          katz_score?: number | null
          last_name?: string
          last_visit_at?: string | null
          lat?: number | null
          lng?: number | null
          mutuality?: string
          mutuality_number?: string
          next_visit_at?: string | null
          niss?: string | null
          notes?: string | null
          phone?: string
          photo_url?: string | null
          postal_code?: string
          prescribing_doctor?: string
          profile_id?: string | null
          street?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_billing_catalog: {
        Row: {
          applies_on_weekend: boolean
          code: string
          created_at: string
          description: string | null
          home_hourly_rate: number
          id: string
          label: string
          metadata: Json
          other_place_hourly_rate: number
          segment_type: string
          updated_at: string
        }
        Insert: {
          applies_on_weekend?: boolean
          code: string
          created_at?: string
          description?: string | null
          home_hourly_rate?: number
          id?: string
          label: string
          metadata?: Json
          other_place_hourly_rate?: number
          segment_type: string
          updated_at?: string
        }
        Update: {
          applies_on_weekend?: boolean
          code?: string
          created_at?: string
          description?: string | null
          home_hourly_rate?: number
          id?: string
          label?: string
          metadata?: Json
          other_place_hourly_rate?: number
          segment_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bce_number: string | null
          company_name: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          inami_number: string | null
          last_name: string
          metadata: Json
          phone: string | null
          professional_city: string | null
          professional_house_number: string | null
          professional_postal_code: string | null
          professional_status: Database["public"]["Enums"]["professional_status"] | null
          professional_street: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bce_number?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          first_name?: string
          id: string
          inami_number?: string | null
          last_name?: string
          metadata?: Json
          phone?: string | null
          professional_city?: string | null
          professional_house_number?: string | null
          professional_postal_code?: string | null
          professional_status?: Database["public"]["Enums"]["professional_status"] | null
          professional_street?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bce_number?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          inami_number?: string | null
          last_name?: string
          metadata?: Json
          phone?: string | null
          professional_city?: string | null
          professional_house_number?: string | null
          professional_postal_code?: string | null
          professional_status?: Database["public"]["Enums"]["professional_status"] | null
          professional_street?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      visit_hourly_billing_lines: {
        Row: {
          amount: number
          code: string
          created_at: string
          hourly_rate: number
          id: string
          is_weekend_or_holiday: boolean
          justification: string | null
          label: string
          line_status: string
          payload: Json
          place_of_service: string
          segment_id: string | null
          segment_type: string
          unit_minutes: number
          updated_at: string
          visit_id: string
        }
        Insert: {
          amount?: number
          code: string
          created_at?: string
          hourly_rate?: number
          id?: string
          is_weekend_or_holiday?: boolean
          justification?: string | null
          label: string
          line_status?: string
          payload?: Json
          place_of_service?: string
          segment_id?: string | null
          segment_type: string
          unit_minutes?: number
          updated_at?: string
          visit_id: string
        }
        Update: {
          amount?: number
          code?: string
          created_at?: string
          hourly_rate?: number
          id?: string
          is_weekend_or_holiday?: boolean
          justification?: string | null
          label?: string
          line_status?: string
          payload?: Json
          place_of_service?: string
          segment_id?: string | null
          segment_type?: string
          unit_minutes?: number
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_hourly_billing_lines_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "pilot_billing_catalog"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "visit_hourly_billing_lines_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "visit_time_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_hourly_billing_lines_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_hourly_billing_summaries: {
        Row: {
          created_at: string
          delta_amount: number
          direct_amount: number
          estimated_forfait_amount: number
          generated_at: string
          geofencing_coverage_ratio: number | null
          geofencing_enabled: boolean
          hourly_amount: number
          indirect_amount: number
          indirect_ratio: number | null
          place_of_service: string
          requires_manual_review: boolean
          review_reasons: Json
          status: string
          total_billable_minutes: number
          total_direct_minutes: number
          total_indirect_minutes: number
          total_travel_minutes: number
          travel_amount: number
          updated_at: string
          validated_at: string | null
          visit_id: string
        }
        Insert: {
          created_at?: string
          delta_amount?: number
          direct_amount?: number
          estimated_forfait_amount?: number
          generated_at?: string
          geofencing_coverage_ratio?: number | null
          geofencing_enabled?: boolean
          hourly_amount?: number
          indirect_amount?: number
          indirect_ratio?: number | null
          place_of_service?: string
          requires_manual_review?: boolean
          review_reasons?: Json
          status?: string
          total_billable_minutes?: number
          total_direct_minutes?: number
          total_indirect_minutes?: number
          total_travel_minutes?: number
          travel_amount?: number
          updated_at?: string
          validated_at?: string | null
          visit_id: string
        }
        Update: {
          created_at?: string
          delta_amount?: number
          direct_amount?: number
          estimated_forfait_amount?: number
          generated_at?: string
          geofencing_coverage_ratio?: number | null
          geofencing_enabled?: boolean
          hourly_amount?: number
          indirect_amount?: number
          indirect_ratio?: number | null
          place_of_service?: string
          requires_manual_review?: boolean
          review_reasons?: Json
          status?: string
          total_billable_minutes?: number
          total_direct_minutes?: number
          total_indirect_minutes?: number
          total_travel_minutes?: number
          travel_amount?: number
          updated_at?: string
          validated_at?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_hourly_billing_summaries_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_location_events: {
        Row: {
          accuracy_meters: number | null
          created_at: string
          distance_to_patient_m: number | null
          geofence_state: string
          id: string
          latitude: number
          longitude: number
          metadata: Json
          recorded_at: string
          source: string
          visit_id: string
        }
        Insert: {
          accuracy_meters?: number | null
          created_at?: string
          distance_to_patient_m?: number | null
          geofence_state?: string
          id?: string
          latitude: number
          longitude: number
          metadata?: Json
          recorded_at: string
          source?: string
          visit_id: string
        }
        Update: {
          accuracy_meters?: number | null
          created_at?: string
          distance_to_patient_m?: number | null
          geofence_state?: string
          id?: string
          latitude?: number
          longitude?: number
          metadata?: Json
          recorded_at?: string
          source?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_location_events_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_time_segments: {
        Row: {
          correction_reason: string | null
          created_at: string
          duration_minutes: number
          ended_at: string
          id: string
          is_billable: boolean
          is_corrected: boolean
          metadata: Json
          notes: string | null
          place_of_service: string
          requires_manual_review: boolean
          segment_type: string
          source: string
          started_at: string
          updated_at: string
          visit_id: string
        }
        Insert: {
          correction_reason?: string | null
          created_at?: string
          duration_minutes?: number
          ended_at: string
          id?: string
          is_billable?: boolean
          is_corrected?: boolean
          metadata?: Json
          notes?: string | null
          place_of_service?: string
          requires_manual_review?: boolean
          segment_type: string
          source?: string
          started_at: string
          updated_at?: string
          visit_id: string
        }
        Update: {
          correction_reason?: string | null
          created_at?: string
          duration_minutes?: number
          ended_at?: string
          id?: string
          is_billable?: boolean
          is_corrected?: boolean
          metadata?: Json
          notes?: string | null
          place_of_service?: string
          requires_manual_review?: boolean
          segment_type?: string
          source?: string
          started_at?: string
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_time_segments_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_acts: {
        Row: {
          category: string
          code: string
          created_at: string
          id: string
          label: string
          value_w: number
          visit_id: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          id?: string
          label: string
          value_w?: number
          visit_id: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          id?: string
          label?: string
          value_w?: number
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_acts_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_vitals: {
        Row: {
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          created_at: string
          glycemia: number | null
          heart_rate: number | null
          oxygen_saturation: number | null
          pain: number | null
          temperature: number | null
          updated_at: string
          visit_id: string
          weight: number | null
        }
        Insert: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          glycemia?: number | null
          heart_rate?: number | null
          oxygen_saturation?: number | null
          pain?: number | null
          temperature?: number | null
          updated_at?: string
          visit_id: string
          weight?: number | null
        }
        Update: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          created_at?: string
          glycemia?: number | null
          heart_rate?: number | null
          oxygen_saturation?: number | null
          pain?: number | null
          temperature?: number | null
          updated_at?: string
          visit_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_vitals_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: true
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          completed_at: string | null
          created_at: string
          had_episode_id: string | null
          id: string
          notes: string | null
          nurse_id: string | null
          patient_id: string
          scheduled_end: string | null
          scheduled_start: string
          signature: string | null
          status: Database["public"]["Enums"]["visit_status"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          had_episode_id?: string | null
          id?: string
          notes?: string | null
          nurse_id?: string | null
          patient_id: string
          scheduled_end?: string | null
          scheduled_start: string
          signature?: string | null
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          had_episode_id?: string | null
          id?: string
          notes?: string | null
          nurse_id?: string | null
          patient_id?: string
          scheduled_end?: string | null
          scheduled_start?: string
          signature?: string | null
          status?: Database["public"]["Enums"]["visit_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_had_episode_id_fkey"
            columns: ["had_episode_id"]
            isOneToOne: false
            referencedRelation: "had_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_nurse_id_fkey"
            columns: ["nurse_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      wound_assessments: {
        Row: {
          created_at: string
          depth_cm: number | null
          exudate_level: string
          had_episode_id: string | null
          id: string
          length_cm: number | null
          metadata: Json
          notes: string | null
          pain: number | null
          patient_id: string
          recorded_at: string
          recorded_by_profile_id: string | null
          tissue_type: string
          updated_at: string
          visit_id: string | null
          width_cm: number | null
          wound_label: string
          wound_type: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          depth_cm?: number | null
          exudate_level?: string
          had_episode_id?: string | null
          id?: string
          length_cm?: number | null
          metadata?: Json
          notes?: string | null
          pain?: number | null
          patient_id: string
          recorded_at?: string
          recorded_by_profile_id?: string | null
          tissue_type?: string
          updated_at?: string
          visit_id?: string | null
          width_cm?: number | null
          wound_label?: string
          wound_type?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          depth_cm?: number | null
          exudate_level?: string
          had_episode_id?: string | null
          id?: string
          length_cm?: number | null
          metadata?: Json
          notes?: string | null
          pain?: number | null
          patient_id?: string
          recorded_at?: string
          recorded_by_profile_id?: string | null
          tissue_type?: string
          updated_at?: string
          visit_id?: string | null
          width_cm?: number | null
          wound_label?: string
          wound_type?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wound_assessments_had_episode_id_fkey"
            columns: ["had_episode_id"]
            isOneToOne: false
            referencedRelation: "had_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wound_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wound_assessments_recorded_by_profile_id_fkey"
            columns: ["recorded_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wound_assessments_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_belrai_assessment: {
        Args: { target_assessment_id: string }
        Returns: boolean
      }
      can_access_visit: { Args: { target_visit_id: string }; Returns: boolean }
      has_any_role: {
        Args: { required_roles: Database["public"]["Enums"]["user_role"][] }
        Returns: boolean
      }
      is_patient_owner: {
        Args: { target_patient_id: string }
        Returns: boolean
      }
      log_data_access: {
        Args: {
          p_action?: string
          p_contains_pii?: boolean
          p_ip_hint?: string | null
          p_metadata?: Json
          p_patient_id?: string | null
          p_record_id?: string | null
          p_resource_label?: string | null
          p_severity?: string
          p_system_generated?: boolean
          p_table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      belrai_assessment_status:
        | "draft"
        | "in_review"
        | "ready_for_sync"
        | "synced"
        | "sync_error"
      belrai_evidence_source:
        | "patient_profile"
        | "clinical_history"
        | "care_plan"
        | "questionnaire"
        | "schedule"
        | "manual"
      belrai_participant_status: "invited" | "contributed" | "declined"
      belrai_priority: "low" | "medium" | "high"
      belrai_sync_status:
        | "local_only"
        | "queued"
        | "processing"
        | "synced"
        | "error"
      dashboard_scope: "admin" | "coordinator" | "billing"
      had_eligibility_result:
        | "eligible"
        | "eligible_with_conditions"
        | "not_eligible"
      had_episode_status:
        | "screening"
        | "eligible"
        | "planned"
        | "active"
        | "paused"
        | "escalated"
        | "closed"
        | "cancelled"
      had_episode_type:
        | "opat"
        | "oncology_at_home"
        | "heart_failure_virtual_ward"
        | "post_acute_virtual_ward"
        | "other"
      had_measurement_source:
        | "patient"
        | "nurse"
        | "device"
        | "hospital"
        | "lab"
        | "questionnaire"
      had_round_decision:
        | "continue_episode"
        | "adapt_plan"
        | "call_patient"
        | "urgent_nurse_visit"
        | "send_to_ed"
        | "rehospitalize"
        | "close_episode"
      had_team_role:
        | "specialist"
        | "gp"
        | "nurse"
        | "coordinator"
        | "pharmacist"
        | "caregiver"
        | "patient"
        | "hospital_case_manager"
        | "other"
      katz_category: "O" | "A" | "B" | "C" | "Cd"
      patient_gender: "M" | "F" | "X"
      professional_status:
        | "independant"
        | "independant_complementaire"
        | "salarie"
      user_role:
        | "nurse"
        | "coordinator"
        | "patient"
        | "admin"
        | "billing_office"
      visit_status: "planned" | "in_progress" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      dashboard_scope: ["admin", "coordinator", "billing"],
      had_eligibility_result: ["eligible", "eligible_with_conditions", "not_eligible"],
      had_episode_status: [
        "screening",
        "eligible",
        "planned",
        "active",
        "paused",
        "escalated",
        "closed",
        "cancelled",
      ],
      had_episode_type: [
        "opat",
        "oncology_at_home",
        "heart_failure_virtual_ward",
        "post_acute_virtual_ward",
        "other",
      ],
      had_measurement_source: ["patient", "nurse", "device", "hospital", "lab", "questionnaire"],
      had_round_decision: [
        "continue_episode",
        "adapt_plan",
        "call_patient",
        "urgent_nurse_visit",
        "send_to_ed",
        "rehospitalize",
        "close_episode",
      ],
      had_team_role: [
        "specialist",
        "gp",
        "nurse",
        "coordinator",
        "pharmacist",
        "caregiver",
        "patient",
        "hospital_case_manager",
        "other",
      ],
      katz_category: ["O", "A", "B", "C", "Cd"],
      patient_gender: ["M", "F", "X"],
      professional_status: ["independant", "independant_complementaire", "salarie"],
      user_role: ["nurse", "coordinator", "patient", "admin", "billing_office"],
      visit_status: ["planned", "in_progress", "completed", "cancelled"],
    },
  },
} as const
