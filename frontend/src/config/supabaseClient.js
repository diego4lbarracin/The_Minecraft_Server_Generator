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
    flowType: "implicit", // Required: PKCE stores code_verifier in sessionStorage which is lost when email link opens a new tab
  },
});
