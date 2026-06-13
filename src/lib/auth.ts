import { supabase } from './db';

export interface UserSession {
  email: string;
  role: 'admin' | 'buyer';
}

const SESSION_KEY = 'ready_rank_session_v1';

export const authService = {
  // Check if Supabase client is active
  isSupabase: () => !!supabase,

  // Get active session
  getCurrentUser(): UserSession | null {
    if (typeof window === 'undefined') return null;

    // Local Storage check first (fallback or persistent mock)
    const localSession = localStorage.getItem(SESSION_KEY);
    if (localSession) {
      try {
        return JSON.parse(localSession);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Log in
  async signIn(email: string, password?: string): Promise<UserSession | null> {
    const trimmedEmail = email.toLowerCase().trim();
    const role: 'admin' | 'buyer' = trimmedEmail === 'admin@readyrank.com' ? 'admin' : 'buyer';

    if (supabase) {
      try {
        // Attempt actual Supabase Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: password || 'defaultpassword123',
        });
        
        if (error) {
          // If user doesn't exist, we might try auto-signing them up for simple order flow,
          // but let's stick to supabase login.
          console.warn('Supabase signIn failed, trying automatic signup for convenience:', error.message);
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: trimmedEmail,
            password: password || 'defaultpassword123',
          });
          if (signUpError) throw signUpError;
          
          const session = { email: trimmedEmail, role };
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
          return session;
        }

        const session = { email: trimmedEmail, role };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
      } catch (err) {
        console.error('Supabase signIn catch error, using fallback:', err);
      }
    }

    // LocalStorage fallback auth
    const session: UserSession = {
      email: trimmedEmail,
      role: role,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(new Event('auth-change'));
    return session;
  },

  // Register
  async signUp(email: string, password?: string): Promise<UserSession | null> {
    return this.signIn(email, password);
  },

  // Log out
  async signOut(): Promise<void> {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Supabase signOut error:', err);
      }
    }
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event('auth-change'));
  },

  // Check if current user is admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }
};
