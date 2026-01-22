import { createClient } from "@supabase/supabase-js";

// Replace these with your actual Supabase project URL and API key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage, // Use session storage so session expires when browser closes
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    redirectTo: window.location.origin, // Redirect to landing page after email confirmation
  },
});
