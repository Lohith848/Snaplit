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
    let loadProfileTimeout: NodeJS.Timeout;

    const loadProfile = async (userId: string) => {
      try {
        console.log('Loading profile for user:', userId);
        const userProfile = await getUserProfile(userId);
        if (isMounted) {
          if (userProfile) {
            console.log('Profile loaded successfully');
            setProfile(userProfile);
          } else {
            console.log('No profile found for user (new user)');
            setProfile(null);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        if (isMounted) {
          setProfile(null);
          setLoading(false);
        }
      }
    };

    const initAuth = async () => {
      try {
        console.log('Checking for existing session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (sessionError) {
          console.error('Session error:', sessionError);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('Session found for user:', session.user.id);
          setUser({
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata,
          });
          // Set timeout to prevent infinite loading
          setLoading(true);
          loadProfileTimeout = setTimeout(() => {
            console.warn('Profile load timeout - showing UI anyway');
            if (isMounted) setLoading(false);
          }, 8000);
          await loadProfile(session.user.id);
          clearTimeout(loadProfileTimeout);
        } else {
          console.log('No session found');
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (isMounted) setLoading(false);
      }
    };

    // Initialize auth immediately
    initAuth();

    // Also listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('Auth state changed:', event, session?.user?.id);

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata,
        });
        setLoading(true);
        loadProfileTimeout = setTimeout(() => {
          console.warn('Profile load timeout - showing UI anyway');
          if (isMounted) setLoading(false);
        }, 8000);
        await loadProfile(session.user.id);
        clearTimeout(loadProfileTimeout);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(loadProfileTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  return { user, profile, loading, setProfile, error };
}
