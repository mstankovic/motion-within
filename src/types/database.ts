
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "block_exercises": {
                  Row: {
                    "created_at": string,"exercise_id": string,"id": string,"notes": string | null,"progression_step_kg": number | null,"rest_seconds": number | null,"sort_order": number,"target_band_label": string | null,"target_duration_seconds": number | null,"target_reps_max": number | null,"target_reps_min": number | null,"target_sets": number,"target_trx_position": string | null,"target_weight_kg": number | null,"tempo": string | null,"updated_at": string,"workout_block_id": string
                  }
                  Insert: {
                    "created_at"?: string,"exercise_id": string,"id"?: string,"notes"?: string | null,"progression_step_kg"?: number | null,"rest_seconds"?: number | null,"sort_order": number,"target_band_label"?: string | null,"target_duration_seconds"?: number | null,"target_reps_max"?: number | null,"target_reps_min"?: number | null,"target_sets"?: number,"target_trx_position"?: string | null,"target_weight_kg"?: number | null,"tempo"?: string | null,"updated_at"?: string,"workout_block_id": string
                  }
                  Update: {
                    "created_at"?: string,"exercise_id"?: string,"id"?: string,"notes"?: string | null,"progression_step_kg"?: number | null,"rest_seconds"?: number | null,"sort_order"?: number,"target_band_label"?: string | null,"target_duration_seconds"?: number | null,"target_reps_max"?: number | null,"target_reps_min"?: number | null,"target_sets"?: number,"target_trx_position"?: string | null,"target_weight_kg"?: number | null,"tempo"?: string | null,"updated_at"?: string,"workout_block_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "block_exercises_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "block_exercises_workout_block_id_fkey"
      columns: ["workout_block_id"]
isOneToOne: false
      referencedRelation: "workout_blocks"
      referencedColumns: ["id"]
    }
                  ]
                },"body_measurements": {
                  Row: {
                    "chest_cm": number | null,"created_at": string,"hips_cm": number | null,"id": string,"measured_on": string,"notes": string | null,"owner_id": string,"thigh_cm": number | null,"updated_at": string,"upper_arm_cm": number | null,"waist_cm": number | null,"weight_kg": number | null
                  }
                  Insert: {
                    "chest_cm"?: number | null,"created_at"?: string,"hips_cm"?: number | null,"id"?: string,"measured_on": string,"notes"?: string | null,"owner_id"?: string,"thigh_cm"?: number | null,"updated_at"?: string,"upper_arm_cm"?: number | null,"waist_cm"?: number | null,"weight_kg"?: number | null
                  }
                  Update: {
                    "chest_cm"?: number | null,"created_at"?: string,"hips_cm"?: number | null,"id"?: string,"measured_on"?: string,"notes"?: string | null,"owner_id"?: string,"thigh_cm"?: number | null,"updated_at"?: string,"upper_arm_cm"?: number | null,"waist_cm"?: number | null,"weight_kg"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"equipment": {
                  Row: {
                    "id": string,"name_en": string,"name_sr": string,"slug": string
                  }
                  Insert: {
                    "id"?: string,"name_en": string,"name_sr": string,"slug": string
                  }
                  Update: {
                    "id"?: string,"name_en"?: string,"name_sr"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"exercise_equipment": {
                  Row: {
                    "equipment_id": string,"exercise_id": string
                  }
                  Insert: {
                    "equipment_id": string,"exercise_id": string
                  }
                  Update: {
                    "equipment_id"?: string,"exercise_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "exercise_equipment_equipment_id_fkey"
      columns: ["equipment_id"]
isOneToOne: false
      referencedRelation: "equipment"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "exercise_equipment_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    }
                  ]
                },"exercise_muscles": {
                  Row: {
                    "exercise_id": string,"muscle_group_id": string,"role": Database["public"]['Enums']["muscle_role"]
                  }
                  Insert: {
                    "exercise_id": string,"muscle_group_id": string,"role": Database["public"]['Enums']["muscle_role"]
                  }
                  Update: {
                    "exercise_id"?: string,"muscle_group_id"?: string,"role"?: Database["public"]['Enums']["muscle_role"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "exercise_muscles_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "exercise_muscles_muscle_group_id_fkey"
      columns: ["muscle_group_id"]
isOneToOne: false
      referencedRelation: "muscle_groups"
      referencedColumns: ["id"]
    }
                  ]
                },"exercises": {
                  Row: {
                    "copied_from_id": string | null,"created_at": string,"custom_description": string | null,"custom_name": string | null,"description_en": string | null,"description_sr": string | null,"id": string,"is_active": boolean,"is_mobility": boolean,"name_en": string | null,"name_sr": string | null,"owner_id": string | null,"slug": string | null,"source": Database["public"]['Enums']["exercise_source"],"tracking_mode": Database["public"]['Enums']["tracking_mode"],"updated_at": string
                  }
                  Insert: {
                    "copied_from_id"?: string | null,"created_at"?: string,"custom_description"?: string | null,"custom_name"?: string | null,"description_en"?: string | null,"description_sr"?: string | null,"id"?: string,"is_active"?: boolean,"is_mobility"?: boolean,"name_en"?: string | null,"name_sr"?: string | null,"owner_id"?: string | null,"slug"?: string | null,"source": Database["public"]['Enums']["exercise_source"],"tracking_mode": Database["public"]['Enums']["tracking_mode"],"updated_at"?: string
                  }
                  Update: {
                    "copied_from_id"?: string | null,"created_at"?: string,"custom_description"?: string | null,"custom_name"?: string | null,"description_en"?: string | null,"description_sr"?: string | null,"id"?: string,"is_active"?: boolean,"is_mobility"?: boolean,"name_en"?: string | null,"name_sr"?: string | null,"owner_id"?: string | null,"slug"?: string | null,"source"?: Database["public"]['Enums']["exercise_source"],"tracking_mode"?: Database["public"]['Enums']["tracking_mode"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "exercises_copied_from_id_fkey"
      columns: ["copied_from_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    }
                  ]
                },"muscle_groups": {
                  Row: {
                    "id": string,"name_en": string,"name_sr": string,"slug": string
                  }
                  Insert: {
                    "id"?: string,"name_en": string,"name_sr": string,"slug": string
                  }
                  Update: {
                    "id"?: string,"name_en"?: string,"name_sr"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"notification_preferences": {
                  Row: {
                    "default_reminder_minutes_before": number,"default_workout_time": string,"owner_id": string,"quiet_hours_end": string | null,"quiet_hours_start": string | null,"updated_at": string,"workout_reminders_enabled": boolean
                  }
                  Insert: {
                    "default_reminder_minutes_before"?: number,"default_workout_time"?: string,"owner_id": string,"quiet_hours_end"?: string | null,"quiet_hours_start"?: string | null,"updated_at"?: string,"workout_reminders_enabled"?: boolean
                  }
                  Update: {
                    "default_reminder_minutes_before"?: number,"default_workout_time"?: string,"owner_id"?: string,"quiet_hours_end"?: string | null,"quiet_hours_start"?: string | null,"updated_at"?: string,"workout_reminders_enabled"?: boolean
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string | null,"goals": (string)[],"id": string,"locale": string,"onboarding_completed": boolean,"preferred_weekdays": (number)[],"safety_notice_acknowledged_at": string | null,"timezone": string,"unit_system": string,"updated_at": string,"week_starts_on": number
                  }
                  Insert: {
                    "created_at"?: string,"display_name"?: string | null,"goals"?: (string)[],"id": string,"locale"?: string,"onboarding_completed"?: boolean,"preferred_weekdays"?: (number)[],"safety_notice_acknowledged_at"?: string | null,"timezone"?: string,"unit_system"?: string,"updated_at"?: string,"week_starts_on"?: number
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string | null,"goals"?: (string)[],"id"?: string,"locale"?: string,"onboarding_completed"?: boolean,"preferred_weekdays"?: (number)[],"safety_notice_acknowledged_at"?: string | null,"timezone"?: string,"unit_system"?: string,"updated_at"?: string,"week_starts_on"?: number
                  }
                  Relationships: [
                    
                  ]
                },"program_days": {
                  Row: {
                    "created_at": string,"day_index": number,"description": string | null,"id": string,"intensity": Database["public"]['Enums']["program_intensity"],"preferred_weekday": number | null,"program_id": string,"title": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"day_index": number,"description"?: string | null,"id"?: string,"intensity"?: Database["public"]['Enums']["program_intensity"],"preferred_weekday"?: number | null,"program_id": string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"day_index"?: number,"description"?: string | null,"id"?: string,"intensity"?: Database["public"]['Enums']["program_intensity"],"preferred_weekday"?: number | null,"program_id"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "program_days_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    }
                  ]
                },"programs": {
                  Row: {
                    "archived_at": string | null,"created_at": string,"description": string | null,"id": string,"is_active": boolean,"name": string,"owner_id": string,"source": Database["public"]['Enums']["program_source"],"updated_at": string
                  }
                  Insert: {
                    "archived_at"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name": string,"owner_id"?: string,"source"?: Database["public"]['Enums']["program_source"],"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"is_active"?: boolean,"name"?: string,"owner_id"?: string,"source"?: Database["public"]['Enums']["program_source"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"progression_suggestions": {
                  Row: {
                    "block_exercise_id": string | null,"exercise_id": string,"generated_at": string,"id": string,"owner_id": string,"program_id": string | null,"reason_code": string,"reason_payload": NonNullable<Json>,"resolved_at": string | null,"snoozed_until": string | null,"status": Database["public"]['Enums']["suggestion_status"],"suggested_payload": NonNullable<Json>,"suggestion_type": string
                  }
                  Insert: {
                    "block_exercise_id"?: string | null,"exercise_id": string,"generated_at"?: string,"id"?: string,"owner_id"?: string,"program_id"?: string | null,"reason_code": string,"reason_payload"?: NonNullable<Json>,"resolved_at"?: string | null,"snoozed_until"?: string | null,"status"?: Database["public"]['Enums']["suggestion_status"],"suggested_payload"?: NonNullable<Json>,"suggestion_type": string
                  }
                  Update: {
                    "block_exercise_id"?: string | null,"exercise_id"?: string,"generated_at"?: string,"id"?: string,"owner_id"?: string,"program_id"?: string | null,"reason_code"?: string,"reason_payload"?: NonNullable<Json>,"resolved_at"?: string | null,"snoozed_until"?: string | null,"status"?: Database["public"]['Enums']["suggestion_status"],"suggested_payload"?: NonNullable<Json>,"suggestion_type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "progression_suggestions_block_exercise_id_fkey"
      columns: ["block_exercise_id"]
isOneToOne: false
      referencedRelation: "block_exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "progression_suggestions_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "progression_suggestions_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    }
                  ]
                },"push_subscriptions": {
                  Row: {
                    "auth": string,"created_at": string,"endpoint": string,"id": string,"last_used_at": string | null,"owner_id": string,"p256dh": string,"revoked_at": string | null,"user_agent": string | null
                  }
                  Insert: {
                    "auth": string,"created_at"?: string,"endpoint": string,"id"?: string,"last_used_at"?: string | null,"owner_id"?: string,"p256dh": string,"revoked_at"?: string | null,"user_agent"?: string | null
                  }
                  Update: {
                    "auth"?: string,"created_at"?: string,"endpoint"?: string,"id"?: string,"last_used_at"?: string | null,"owner_id"?: string,"p256dh"?: string,"revoked_at"?: string | null,"user_agent"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"reminder_deliveries": {
                  Row: {
                    "id": string,"owner_id": string,"reminder_at": string,"scheduled_workout_id": string,"sent_at": string,"success_count": number
                  }
                  Insert: {
                    "id"?: string,"owner_id": string,"reminder_at": string,"scheduled_workout_id": string,"sent_at"?: string,"success_count"?: number
                  }
                  Update: {
                    "id"?: string,"owner_id"?: string,"reminder_at"?: string,"scheduled_workout_id"?: string,"sent_at"?: string,"success_count"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "reminder_deliveries_scheduled_workout_id_fkey"
      columns: ["scheduled_workout_id"]
isOneToOne: false
      referencedRelation: "scheduled_workouts"
      referencedColumns: ["id"]
    }
                  ]
                },"scheduled_workouts": {
                  Row: {
                    "created_at": string,"id": string,"owner_id": string,"planned_date": string,"planned_time": string | null,"program_day_id": string | null,"reminder_at": string | null,"status": Database["public"]['Enums']["scheduled_status"],"title": string,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"owner_id"?: string,"planned_date": string,"planned_time"?: string | null,"program_day_id"?: string | null,"reminder_at"?: string | null,"status"?: Database["public"]['Enums']["scheduled_status"],"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"owner_id"?: string,"planned_date"?: string,"planned_time"?: string | null,"program_day_id"?: string | null,"reminder_at"?: string | null,"status"?: Database["public"]['Enums']["scheduled_status"],"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "scheduled_workouts_program_day_id_fkey"
      columns: ["program_day_id"]
isOneToOne: false
      referencedRelation: "program_days"
      referencedColumns: ["id"]
    }
                  ]
                },"session_exercises": {
                  Row: {
                    "block_sort_order": number,"block_title_snapshot": string | null,"block_type_snapshot": Database["public"]['Enums']["block_type"],"created_at": string,"exercise_name_snapshot": string,"exercise_sort_order": number,"id": string,"instructions_snapshot": string | null,"is_mobility_snapshot": boolean,"notes": string | null,"owner_id": string,"pain_flag": boolean,"pain_note": string | null,"plan_notes_snapshot": string | null,"progression_step_kg_snapshot": number | null,"rest_seconds_snapshot": number | null,"rounds_snapshot": number,"session_id": string,"source_block_exercise_id": string | null,"source_exercise_id": string | null,"status": Database["public"]['Enums']["session_exercise_status"],"target_band_label_snapshot": string | null,"target_duration_seconds_snapshot": number | null,"target_reps_max_snapshot": number | null,"target_reps_min_snapshot": number | null,"target_sets_snapshot": number,"target_trx_position_snapshot": string | null,"target_weight_kg_snapshot": number | null,"tempo_snapshot": string | null,"tracking_mode_snapshot": Database["public"]['Enums']["tracking_mode"],"updated_at": string
                  }
                  Insert: {
                    "block_sort_order"?: number,"block_title_snapshot"?: string | null,"block_type_snapshot"?: Database["public"]['Enums']["block_type"],"created_at"?: string,"exercise_name_snapshot": string,"exercise_sort_order"?: number,"id"?: string,"instructions_snapshot"?: string | null,"is_mobility_snapshot"?: boolean,"notes"?: string | null,"owner_id"?: string,"pain_flag"?: boolean,"pain_note"?: string | null,"plan_notes_snapshot"?: string | null,"progression_step_kg_snapshot"?: number | null,"rest_seconds_snapshot"?: number | null,"rounds_snapshot"?: number,"session_id": string,"source_block_exercise_id"?: string | null,"source_exercise_id"?: string | null,"status"?: Database["public"]['Enums']["session_exercise_status"],"target_band_label_snapshot"?: string | null,"target_duration_seconds_snapshot"?: number | null,"target_reps_max_snapshot"?: number | null,"target_reps_min_snapshot"?: number | null,"target_sets_snapshot"?: number,"target_trx_position_snapshot"?: string | null,"target_weight_kg_snapshot"?: number | null,"tempo_snapshot"?: string | null,"tracking_mode_snapshot": Database["public"]['Enums']["tracking_mode"],"updated_at"?: string
                  }
                  Update: {
                    "block_sort_order"?: number,"block_title_snapshot"?: string | null,"block_type_snapshot"?: Database["public"]['Enums']["block_type"],"created_at"?: string,"exercise_name_snapshot"?: string,"exercise_sort_order"?: number,"id"?: string,"instructions_snapshot"?: string | null,"is_mobility_snapshot"?: boolean,"notes"?: string | null,"owner_id"?: string,"pain_flag"?: boolean,"pain_note"?: string | null,"plan_notes_snapshot"?: string | null,"progression_step_kg_snapshot"?: number | null,"rest_seconds_snapshot"?: number | null,"rounds_snapshot"?: number,"session_id"?: string,"source_block_exercise_id"?: string | null,"source_exercise_id"?: string | null,"status"?: Database["public"]['Enums']["session_exercise_status"],"target_band_label_snapshot"?: string | null,"target_duration_seconds_snapshot"?: number | null,"target_reps_max_snapshot"?: number | null,"target_reps_min_snapshot"?: number | null,"target_sets_snapshot"?: number,"target_trx_position_snapshot"?: string | null,"target_weight_kg_snapshot"?: number | null,"tempo_snapshot"?: string | null,"tracking_mode_snapshot"?: Database["public"]['Enums']["tracking_mode"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "session_exercises_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "workout_sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_exercises_source_block_exercise_id_fkey"
      columns: ["source_block_exercise_id"]
isOneToOne: false
      referencedRelation: "block_exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "session_exercises_source_exercise_id_fkey"
      columns: ["source_exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    }
                  ]
                },"session_sets": {
                  Row: {
                    "band_label": string | null,"completed": boolean,"created_at": string,"duration_seconds": number | null,"id": string,"is_warmup": boolean,"notes": string | null,"owner_id": string,"reps": number | null,"rpe": number | null,"session_exercise_id": string,"set_number": number,"trx_position": string | null,"updated_at": string,"weight_kg": number | null
                  }
                  Insert: {
                    "band_label"?: string | null,"completed"?: boolean,"created_at"?: string,"duration_seconds"?: number | null,"id"?: string,"is_warmup"?: boolean,"notes"?: string | null,"owner_id"?: string,"reps"?: number | null,"rpe"?: number | null,"session_exercise_id": string,"set_number": number,"trx_position"?: string | null,"updated_at"?: string,"weight_kg"?: number | null
                  }
                  Update: {
                    "band_label"?: string | null,"completed"?: boolean,"created_at"?: string,"duration_seconds"?: number | null,"id"?: string,"is_warmup"?: boolean,"notes"?: string | null,"owner_id"?: string,"reps"?: number | null,"rpe"?: number | null,"session_exercise_id"?: string,"set_number"?: number,"trx_position"?: string | null,"updated_at"?: string,"weight_kg"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "session_sets_session_exercise_id_fkey"
      columns: ["session_exercise_id"]
isOneToOne: false
      referencedRelation: "session_exercises"
      referencedColumns: ["id"]
    }
                  ]
                },"workout_blocks": {
                  Row: {
                    "block_type": Database["public"]['Enums']["block_type"],"created_at": string,"id": string,"program_day_id": string,"rounds": number,"sort_order": number,"title": string | null,"updated_at": string
                  }
                  Insert: {
                    "block_type"?: Database["public"]['Enums']["block_type"],"created_at"?: string,"id"?: string,"program_day_id": string,"rounds"?: number,"sort_order": number,"title"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "block_type"?: Database["public"]['Enums']["block_type"],"created_at"?: string,"id"?: string,"program_day_id"?: string,"rounds"?: number,"sort_order"?: number,"title"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_blocks_program_day_id_fkey"
      columns: ["program_day_id"]
isOneToOne: false
      referencedRelation: "program_days"
      referencedColumns: ["id"]
    }
                  ]
                },"workout_sessions": {
                  Row: {
                    "completed_at": string | null,"created_at": string,"energy_after": number | null,"id": string,"notes": string | null,"owner_id": string,"program_day_id": string | null,"program_id": string | null,"recovery_rating": number | null,"scheduled_workout_id": string | null,"session_rpe": number | null,"started_at": string,"status": Database["public"]['Enums']["session_status"],"title_snapshot": string,"updated_at": string
                  }
                  Insert: {
                    "completed_at"?: string | null,"created_at"?: string,"energy_after"?: number | null,"id"?: string,"notes"?: string | null,"owner_id"?: string,"program_day_id"?: string | null,"program_id"?: string | null,"recovery_rating"?: number | null,"scheduled_workout_id"?: string | null,"session_rpe"?: number | null,"started_at"?: string,"status"?: Database["public"]['Enums']["session_status"],"title_snapshot": string,"updated_at"?: string
                  }
                  Update: {
                    "completed_at"?: string | null,"created_at"?: string,"energy_after"?: number | null,"id"?: string,"notes"?: string | null,"owner_id"?: string,"program_day_id"?: string | null,"program_id"?: string | null,"recovery_rating"?: number | null,"scheduled_workout_id"?: string | null,"session_rpe"?: number | null,"started_at"?: string,"status"?: Database["public"]['Enums']["session_status"],"title_snapshot"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_sessions_program_day_id_fkey"
      columns: ["program_day_id"]
isOneToOne: false
      referencedRelation: "program_days"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workout_sessions_program_id_fkey"
      columns: ["program_id"]
isOneToOne: false
      referencedRelation: "programs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workout_sessions_scheduled_workout_id_fkey"
      columns: ["scheduled_workout_id"]
isOneToOne: false
      referencedRelation: "scheduled_workouts"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "activate_program":
{ Args: { "p_program_id": string }; Returns: undefined
                           },
"can_read_exercise":
{ Args: { "p_exercise_id": string }; Returns: boolean
                           },
"copy_exercise":
{ Args: { "p_exercise_id": string,"p_locale"?: string }; Returns: string
                           },
"copy_program":
{ Args: { "p_name": string,"p_program_id": string }; Returns: string
                           },
"create_starter_program":
{ Args: { "p_activate"?: boolean,"p_weekdays"?: (number)[] }; Returns: string
                           },
"exercise_completed_sets":
{ Args: { "p_exercise_ids": (string)[] }; Returns: {
              "band_label": string,"completed": boolean,"duration_seconds": number,"exercise_id": string,"is_warmup": boolean,"performed_at": string,"reps": number,"rpe": number,"session_exercise_id": string,"session_id": string,"set_number": number,"tracking_mode": Database["public"]['Enums']["tracking_mode"],"trx_position": string,"weight_kg": number
            }[]
                           },
"exercise_last_performances":
{ Args: { "p_before"?: string,"p_exercise_ids": (string)[] }; Returns: Json
                           },
"exercise_performances":
{ Args: { "p_before"?: string,"p_exercise_id": string,"p_limit"?: number }; Returns: Json
                           },
"owns_exercise":
{ Args: { "p_exercise_id": string }; Returns: boolean
                           },
"owns_program":
{ Args: { "p_program_id": string }; Returns: boolean
                           },
"owns_program_day":
{ Args: { "p_program_day_id": string }; Returns: boolean
                           },
"owns_workout_block":
{ Args: { "p_block_id": string }; Returns: boolean
                           },
"plan_week":
{ Args: { "p_week_start": string }; Returns: number
                           },
"start_session":
{ Args: { "p_scheduled_workout_id": string }; Returns: string
                           },
"starter_add_block":
{ Args: { "p_day_id": string,"p_items": Json,"p_rounds": number,"p_sort": number,"p_title": string,"p_type": Database["public"]['Enums']["block_type"] }; Returns: undefined
                           }
          }
          Enums: {
            "block_type": "single"|"superset"|"circuit","exercise_source": "system"|"user","muscle_role": "primary"|"secondary","program_intensity": "light"|"strong"|"mobility"|"custom","program_source": "starter"|"user","scheduled_status": "planned"|"in_progress"|"completed"|"skipped","session_exercise_status": "pending"|"completed"|"skipped","session_status": "in_progress"|"completed"|"abandoned","suggestion_status": "pending"|"accepted"|"edited"|"dismissed"|"snoozed","tracking_mode": "reps"|"reps_weight"|"reps_band"|"reps_trx"|"duration"|"reps_duration"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "block_type": ["single", "superset", "circuit"],"exercise_source": ["system", "user"],"muscle_role": ["primary", "secondary"],"program_intensity": ["light", "strong", "mobility", "custom"],"program_source": ["starter", "user"],"scheduled_status": ["planned", "in_progress", "completed", "skipped"],"session_exercise_status": ["pending", "completed", "skipped"],"session_status": ["in_progress", "completed", "abandoned"],"suggestion_status": ["pending", "accepted", "edited", "dismissed", "snoozed"],"tracking_mode": ["reps", "reps_weight", "reps_band", "reps_trx", "duration", "reps_duration"]
          }
        }
} as const

