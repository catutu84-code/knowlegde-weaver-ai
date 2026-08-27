export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          earned_at: string
          id: string
          label: string
          user_id: string
        }
        Insert: {
          code: string
          earned_at?: string
          id?: string
          label: string
          user_id: string
        }
        Update: {
          code?: string
          earned_at?: string
          id?: string
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_outputs: {
        Row: {
          content: string | null
          created_at: string
          data: Json | null
          id: string
          kind: string
          mode: string | null
          sources: Json
          subject_id: string | null
          title: string
          topic_id: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          kind: string
          mode?: string | null
          sources?: Json
          subject_id?: string | null
          title: string
          topic_id?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          kind?: string
          mode?: string | null
          sources?: Json
          subject_id?: string | null
          title?: string
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_outputs_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_outputs_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      book_chapters: {
        Row: {
          book_id: string
          content: string | null
          created_at: string
          id: string
          position: number
          source_refs: Json
          style: string | null
          summary: string | null
          title: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          book_id: string
          content?: string | null
          created_at?: string
          id?: string
          position: number
          source_refs?: Json
          style?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          book_id?: string
          content?: string | null
          created_at?: string
          id?: string
          position?: number
          source_refs?: Json
          style?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "book_chapters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_notes: {
        Row: {
          book_id: string
          chapter_position: number
          created_at: string
          excerpt: string
          id: string
          kind: string
          note: string | null
          user_id: string
        }
        Insert: {
          book_id: string
          chapter_position?: number
          created_at?: string
          excerpt: string
          id?: string
          kind?: string
          note?: string | null
          user_id: string
        }
        Update: {
          book_id?: string
          chapter_position?: number
          created_at?: string
          excerpt?: string
          id?: string
          kind?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_notes_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_versions: {
        Row: {
          book_id: string
          chapters_snapshot: Json
          created_at: string
          custom_instruction: string | null
          id: string
          material_ids: string[]
          outline: Json
          reason: string
          sources: Json
          style: string
          subtitle: string | null
          title: string
          user_id: string
          version: number
        }
        Insert: {
          book_id: string
          chapters_snapshot?: Json
          created_at?: string
          custom_instruction?: string | null
          id?: string
          material_ids?: string[]
          outline?: Json
          reason?: string
          sources?: Json
          style: string
          subtitle?: string | null
          title: string
          user_id: string
          version: number
        }
        Update: {
          book_id?: string
          chapters_snapshot?: Json
          created_at?: string
          custom_instruction?: string | null
          id?: string
          material_ids?: string[]
          outline?: Json
          reason?: string
          sources?: Json
          style?: string
          subtitle?: string | null
          title?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "book_versions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          course_id: string | null
          created_at: string
          current_chapter: number
          current_page: number
          current_version: number
          custom_instruction: string | null
          generation_error: string | null
          generation_stage: string | null
          generation_status: string
          id: string
          introduction: string | null
          material_ids: string[]
          outline: Json
          reading_progress: number
          scope: string
          sources: Json
          style: string
          subject_id: string | null
          subtitle: string | null
          title: string
          topic_id: string | null
          total_chapters: number
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          current_chapter?: number
          current_page?: number
          current_version?: number
          custom_instruction?: string | null
          generation_error?: string | null
          generation_stage?: string | null
          generation_status?: string
          id?: string
          introduction?: string | null
          material_ids?: string[]
          outline?: Json
          reading_progress?: number
          scope?: string
          sources?: Json
          style?: string
          subject_id?: string | null
          subtitle?: string | null
          title: string
          topic_id?: string | null
          total_chapters?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          current_chapter?: number
          current_page?: number
          current_version?: number
          custom_instruction?: string | null
          generation_error?: string | null
          generation_stage?: string | null
          generation_status?: string
          id?: string
          introduction?: string | null
          material_ids?: string[]
          outline?: Json
          reading_progress?: number
          scope?: string
          sources?: Json
          style?: string
          subject_id?: string | null
          subtitle?: string | null
          title?: string
          topic_id?: string | null
          total_chapters?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "books_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          sources: Json
          thread_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          sources?: Json
          thread_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          sources?: Json
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          subject_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subject_id?: string | null
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subject_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_threads_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          is_global: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_global?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_global?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          created_at: string
          exam_date: string
          id: string
          notes: string | null
          subject_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_date: string
          id?: string
          notes?: string | null
          subject_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_date?: string
          id?: string
          notes?: string | null
          subject_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          label: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          label?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          label?: string | null
          user_id?: string
        }
        Relationships: []
      }
      flashcard_reviews: {
        Row: {
          created_at: string
          flashcard_id: string
          id: string
          rating: string
          user_id: string
        }
        Insert: {
          created_at?: string
          flashcard_id: string
          id?: string
          rating: string
          user_id: string
        }
        Update: {
          created_at?: string
          flashcard_id?: string
          id?: string
          rating?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          ease: number
          front: string
          id: string
          last_reviewed_at: string | null
          material_id: string | null
          source_ref: string | null
          subject_id: string | null
          topic_id: string | null
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          ease?: number
          front: string
          id?: string
          last_reviewed_at?: string | null
          material_id?: string | null
          source_ref?: string | null
          subject_id?: string | null
          topic_id?: string | null
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          ease?: number
          front?: string
          id?: string
          last_reviewed_at?: string | null
          material_id?: string | null
          source_ref?: string | null
          subject_id?: string | null
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      material_shares: {
        Row: {
          created_at: string
          id: string
          material_id: string
          owner_id: string
          shared_with_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          owner_id: string
          shared_with_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          owner_id?: string
          shared_with_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_shares_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          course_id: string | null
          created_at: string
          description: string | null
          extracted_text: string | null
          file_name: string | null
          file_path: string | null
          id: string
          mime_type: string | null
          size_bytes: number | null
          source_kind: string
          status: string
          status_message: string | null
          subject_id: string | null
          tags: string[]
          title: string
          topic_id: string | null
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          extracted_text?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          source_kind?: string
          status?: string
          status_message?: string | null
          subject_id?: string | null
          tags?: string[]
          title: string
          topic_id?: string | null
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          extracted_text?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          source_kind?: string
          status?: string
          status_message?: string | null
          subject_id?: string | null
          tags?: string[]
          title?: string
          topic_id?: string | null
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      mind_maps: {
        Row: {
          created_at: string
          data: Json
          id: string
          subject_id: string | null
          title: string
          topic_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          subject_id?: string | null
          title: string
          topic_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          subject_id?: string | null
          title?: string
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mind_maps_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mind_maps_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          material_id: string | null
          subject_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          material_id?: string | null
          subject_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          material_id?: string | null
          subject_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          dedupe_key: string | null
          id: string
          kind: string
          link: string | null
          read_at: string | null
          scheduled_for: string
          sent_at: string | null
          snoozed_until: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          dedupe_key?: string | null
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          scheduled_for?: string
          sent_at?: string | null
          snoozed_until?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          dedupe_key?: string | null
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          scheduled_for?: string
          sent_at?: string | null
          snoozed_until?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      pause_consent: {
        Row: {
          consented_at: string | null
          created_at: string
          id: string
          keep_journal: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          consented_at?: string | null
          created_at?: string
          id?: string
          keep_journal?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          consented_at?: string | null
          created_at?: string
          id?: string
          keep_journal?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pause_journal: {
        Row: {
          created_at: string
          entry: string
          id: string
          mood: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entry: string
          id?: string
          mood?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          entry?: string
          id?: string
          mood?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          last_study_date: string | null
          mascot_enabled: boolean
          reduced_motion: boolean
          streak: number
          teach_prefs: Json
          theme: string
          updated_at: string
          user_id: string
          weekly_goal_minutes: number
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          last_study_date?: string | null
          mascot_enabled?: boolean
          reduced_motion?: boolean
          streak?: number
          teach_prefs?: Json
          theme?: string
          updated_at?: string
          user_id: string
          weekly_goal_minutes?: number
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          last_study_date?: string | null
          mascot_enabled?: boolean
          reduced_motion?: boolean
          streak?: number
          teach_prefs?: Json
          theme?: string
          updated_at?: string
          user_id?: string
          weekly_goal_minutes?: number
          xp?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          attempt_id: string
          created_at: string
          feedback: string | null
          id: string
          is_correct: boolean
          question_id: string
          score: number | null
          user_answer: string | null
          user_id: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          is_correct?: boolean
          question_id: string
          score?: number | null
          user_answer?: string | null
          user_id: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          is_correct?: boolean
          question_id?: string
          score?: number | null
          user_answer?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          created_at: string
          finished_at: string | null
          id: string
          quiz_id: string
          score: number
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          finished_at?: string | null
          id?: string
          quiz_id: string
          score?: number
          total?: number
          user_id: string
        }
        Update: {
          created_at?: string
          finished_at?: string | null
          id?: string
          quiz_id?: string
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          concept: string | null
          correct_answer: string
          created_at: string
          explanation: string | null
          id: string
          options: Json
          position: number
          prompt: string
          quiz_id: string
          source_ref: string | null
          type: string
          user_id: string
        }
        Insert: {
          concept?: string | null
          correct_answer: string
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          position?: number
          prompt: string
          quiz_id: string
          source_ref?: string | null
          type?: string
          user_id: string
        }
        Update: {
          concept?: string | null
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          position?: number
          prompt?: string
          quiz_id?: string
          source_ref?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          difficulty: string
          id: string
          is_exam: boolean
          question_type: string
          source_material_ids: string[]
          subject_id: string | null
          title: string
          topic_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty?: string
          id?: string
          is_exam?: boolean
          question_type?: string
          source_material_ids?: string[]
          subject_id?: string | null
          title: string
          topic_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          id?: string
          is_exam?: boolean
          question_type?: string
          source_material_ids?: string[]
          subject_id?: string | null
          title?: string
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          created_at: string
          data: Json
          id: string
          plan_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          plan_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          plan_date?: string
          user_id?: string
        }
        Relationships: []
      }
      study_rhythm: {
        Row: {
          created_at: string
          days_per_week: number
          goal: string | null
          id: string
          max_per_day: number
          minutes_per_day: number
          notifications_enabled: boolean
          onboarded: boolean
          preferred_times: string[]
          quiet_end: string
          quiet_start: string
          subjects: string[]
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_per_week?: number
          goal?: string | null
          id?: string
          max_per_day?: number
          minutes_per_day?: number
          notifications_enabled?: boolean
          onboarded?: boolean
          preferred_times?: string[]
          quiet_end?: string
          quiet_start?: string
          subjects?: string[]
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_per_week?: number
          goal?: string | null
          id?: string
          max_per_day?: number
          minutes_per_day?: number
          notifications_enabled?: boolean
          onboarded?: boolean
          preferred_times?: string[]
          quiet_end?: string
          quiet_start?: string
          subjects?: string[]
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          kind: string
          minutes: number
          subject_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          kind: string
          minutes?: number
          subject_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          kind?: string
          minutes?: number
          subject_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_global: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_global?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_global?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_global: boolean
          name: string
          subject_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_global?: boolean
          name: string
          subject_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_global?: boolean
          name?: string
          subject_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_errors: {
        Row: {
          concept: string | null
          correct_answer: string | null
          created_at: string
          explanation: string | null
          id: string
          question: string
          resolved: boolean
          subject_id: string | null
          times_wrong: number
          topic_id: string | null
          updated_at: string
          user_answer: string | null
          user_id: string
        }
        Insert: {
          concept?: string | null
          correct_answer?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          question: string
          resolved?: boolean
          subject_id?: string | null
          times_wrong?: number
          topic_id?: string | null
          updated_at?: string
          user_answer?: string | null
          user_id: string
        }
        Update: {
          concept?: string | null
          correct_answer?: string | null
          created_at?: string
          explanation?: string | null
          id?: string
          question?: string
          resolved?: boolean
          subject_id?: string | null
          times_wrong?: number
          topic_id?: string | null
          updated_at?: string
          user_answer?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_errors_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_errors_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_read_material: { Args: { _material_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
