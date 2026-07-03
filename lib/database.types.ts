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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      spotify_tokens: {
        Row: {
          access_token: string
          expires_at: string
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          expires_at: string
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          expires_at?: string
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tag_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          category_id: string | null
          color: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tag_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      track_tags: {
        Row: {
          spotify_id: string
          tag_id: string
          tagged_at: string
          user_id: string
        }
        Insert: {
          spotify_id: string
          tag_id: string
          tagged_at?: string
          user_id: string
        }
        Update: {
          spotify_id?: string
          tag_id?: string
          tagged_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_tags_spotify_id_fkey"
            columns: ["spotify_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["spotify_id"]
          },
          {
            foreignKeyName: "track_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          album_art_url: string | null
          artist_names: string[]
          duration_ms: number
          name: string
          spotify_id: string
          uri: string
        }
        Insert: {
          album_art_url?: string | null
          artist_names: string[]
          duration_ms: number
          name: string
          spotify_id: string
          uri: string
        }
        Update: {
          album_art_url?: string | null
          artist_names?: string[]
          duration_ms?: number
          name?: string
          spotify_id?: string
          uri?: string
        }
        Relationships: []
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

