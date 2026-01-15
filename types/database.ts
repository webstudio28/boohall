export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            businesses: {
                Row: {
                    id: string
                    user_id: string
                    website_url: string
                    business_type: string
                    product_description: string | null
                    target_country: string | null
                    language: 'bg' | 'en'
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    website_url: string
                    business_type: string
                    product_description?: string | null
                    target_country?: string | null
                    language?: 'bg' | 'en'
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    website_url?: string
                    business_type?: string
                    product_description?: string | null
                    target_country?: string | null
                    language?: 'bg' | 'en'
                    created_at?: string
                }
            }
            competitors: {
                Row: {
                    id: string
                    business_id: string
                    domain: string
                    content_type: string | null
                    weakness_summary: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    business_id: string
                    domain: string
                    content_type?: string | null
                    weakness_summary?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    business_id?: string
                    domain?: string
                    content_type?: string | null
                    weakness_summary?: string | null
                    created_at?: string
                }
            }
            keywords: {
                Row: {
                    id: string
                    business_id: string
                    keyword: string
                    volume: number | null
                    difficulty: 'Easy' | 'Medium' | 'Hard' | null
                    intent: 'Blog' | 'Landing' | 'Mixed' | null
                    is_selected: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    business_id: string
                    keyword: string
                    volume?: number | null
                    difficulty?: 'Easy' | 'Medium' | 'Hard' | null
                    intent?: 'Blog' | 'Landing' | 'Mixed' | null
                    is_selected?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    business_id?: string
                    keyword?: string
                    volume?: number | null
                    difficulty?: 'Easy' | 'Medium' | 'Hard' | null
                    intent?: 'Blog' | 'Landing' | 'Mixed' | null
                    is_selected?: boolean
                    created_at?: string
                }
            }
            articles: {
                Row: {
                    id: string
                    business_id: string
                    keyword_id: string | null
                    title: string | null
                    content_md: string | null
                    status: 'draft' | 'generating' | 'completed'
                    language: 'bg' | 'en'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    business_id: string
                    keyword_id?: string | null
                    title?: string | null
                    content_md?: string | null
                    status?: 'draft' | 'generating' | 'completed'
                    language?: 'bg' | 'en'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    business_id?: string
                    keyword_id?: string | null
                    title?: string | null
                    content_md?: string | null
                    status?: 'draft' | 'generating' | 'completed'
                    language?: 'bg' | 'en'
                    created_at?: string
                    updated_at?: string
                }
            }
        }
    }
}
