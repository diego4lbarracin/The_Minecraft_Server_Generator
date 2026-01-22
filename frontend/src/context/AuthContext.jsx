import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSigningUp, setIsSigningUp] = useState(false); // Flag to prevent auto-login during signup

  // Fetch user profile from profiles table
  const fetchProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      // If profile fetch fails (e.g., due to RLS), assume user is not approved
      // This prevents unapproved users from bypassing the approval check
      setProfile({ id: userId, approved: false });
    } else {
      setProfile(data);
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Ignore auth state changes during signup to prevent auto-login
      if (isSigningUp) {
        return;
      }

      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isSigningUp]);

  // Sign up function - creates account without keeping user logged in
  const signUp = async (email, password) => {
    // Set flag to prevent auth listener from catching the session
    setIsSigningUp(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    // Immediately discard the session
    if (!error && data.session) {
      await supabase.auth.signOut();
    }

    // Reset flag after a brief delay to ensure signOut completes
    setTimeout(() => {
      setIsSigningUp(false);
    }, 100);

    return { data, error };
  };

  // Sign in function
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  // Sign out function
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // Refresh profile function - useful for checking approval status
  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  // Get authentication token for API calls
  const getAuthToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    getAuthToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
