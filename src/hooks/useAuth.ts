import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getUserProfile } from '../services/userService';
import { UserProfile } from '../types';

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Start non-blocking session check in background
        supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
          if (!isMounted) return;

          if (sessionError) {
            console.error('Session error:', sessionError);
            return;
          }

          if (session?.user) {
            console.log('Session found for user:', session.user.id);
            setUser({
              id: session.user.id,
              email: session.user.email,
              user_metadata: session.user.user_metadata,
            });
            loadProfile(session.user.id);
          }
        }).catch((err) => {
          console.error('getSession failed:', err);
        });
      } catch (err) {
        console.error('Auth initialization error:', err);
      }
    };

    // Start init but don't block - immediately show login
    initAuth();
    setLoading(false);

    // Listen for auth changes - this is the real source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('Auth state changed:', event, session?.user?.id);

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata,
        });
        await loadProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      console.log('Loading profile for user:', userId);
      const userProfile = await getUserProfile(userId);
      if (userProfile) {
        console.log('Profile loaded successfully');
        setProfile(userProfile);
      } else {
        console.log('No profile found for user');
        setProfile(null);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setProfile(null);
    }
  };

  return { user, profile, loading, setProfile, error };
}
