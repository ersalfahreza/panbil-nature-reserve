import { supabase } from '@/lib/supabase';
import type { AuthUser, UserRole } from '../types/auth.types';

/**
 * Login with email and password.
 */
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * Register a new CUSTOMER account.
 * Creates Supabase Auth user, then inserts into public.users and public.customers.
 * Role is strictly assigned server-side (CUSTOMER).
 */
export async function registerCustomer(
  email: string,
  password: string,
  fullName: string,
  phoneNumber: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone_number: phoneNumber,
      },
    },
  });

  if (error) throw error;

  if (!data.user) {
    throw new Error('Registrasi gagal. Silakan coba lagi.');
  }

  return data;
}

/**
 * Logout current user session.
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Request password reset email.
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login`,
  });
  if (error) throw error;
}

/**
 * Fetch authenticated user's profile from public.users table.
 * This is the TRUSTED source of role information.
 */
export async function getCurrentProfile(): Promise<AuthUser | null> {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  console.log('GET CURRENT PROFILE USER ID:', authUser.id);

  const { data: profile, error } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) {
    console.error('GET USER PROFILE ERROR:', error);
    throw error;
  }

  if (!profile) {
    console.error('USER PROFILE NOT FOUND:', authUser.id);
    return null;
  }

  let fullName = authUser.user_metadata?.full_name || profile.email;

  if (profile.role === 'CUSTOMER') {
    const { data: customer } = await supabase
      .from('customers')
      .select('full_name')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (customer) {
      fullName = customer.full_name;
    }
  }

  return {
    id: profile.id,
    email: profile.email,
    role: profile.role as UserRole,
    fullName,
  };
}

/**
 * Translate auth errors to user-friendly Indonesian messages.
 */
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('invalid login credentials'))
      return 'Email atau password salah.';
    if (msg.includes('email not confirmed'))
      return 'Email belum dikonfirmasi. Silakan cek inbox Anda.';
    if (msg.includes('user already registered'))
      return 'Email sudah terdaftar. Silakan gunakan email lain atau login.';
    if (msg.includes('signup is disabled'))
      return 'Registrasi sedang tidak tersedia.';
    if (msg.includes('password') && msg.includes('characters'))
      return 'Password minimal 6 karakter.';
    if (msg.includes('rate limit'))
      return 'Terlalu banyak percobaan. Silakan tunggu beberapa saat.';
    return error.message;
  }
  return 'Terjadi kesalahan. Silakan coba lagi.';
}
