import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import type { AuthUser, AuthStatus } from '../types/auth.types';
import { getCurrentProfile } from '../services/auth.service';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const refreshProfile = useCallback(async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setStatus('unauthenticated');
        return;
      }

      console.log('AUTH USER ID:', authUser.id);

      const profile = await getCurrentProfile();

      console.log('AUTH PROFILE:', profile);

      setUser(profile);
      setStatus(profile ? 'authenticated' : 'unauthenticated');
    } catch (error) {
      console.error('REFRESH PROFILE ERROR:', error);
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      if (!mounted) return;

      setStatus('loading');
      await refreshProfile();
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      console.log('AUTH EVENT:', event);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Jangan langsung melakukan query Supabase di dalam callback.
        // Beri kesempatan session selesai diperbarui terlebih dahulu.
        setTimeout(() => {
          if (mounted) {
            refreshProfile();
          }
        }, 0);
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setStatus('unauthenticated');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  return (
    <AuthContext.Provider value={{ user, status, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}