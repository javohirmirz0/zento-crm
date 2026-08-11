"use client";
import { createClient } from "@supabase/supabase-js";

const FALLBACK_SUPABASE_URL = "https://ilbyzbmridyxxblclpyf.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsYnl6Ym1yaWR5eHhibGNscHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODQxNzMsImV4cCI6MjA4NjU2MDE3M30.HANaWWmqrNObmFjT_XjJoVPcr30tlj4nEoAKJsM6IjM";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});
