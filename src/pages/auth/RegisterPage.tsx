import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, UserPlus, Loader2, Trees, Check } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { registerCustomer, getAuthErrorMessage } from '@/features/auth/services/auth.service';
import { registerSchema } from '@/features/auth/validation/auth.schema';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
  email: '',
  fullName: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
});
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title = 'Daftar - Panbil Nature Reserve';
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setError(null);
  }

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  console.log('REGISTER FORM:', formData);

  setError(null);
  setFieldErrors({});

  const result = registerSchema.safeParse(formData);

  console.log('REGISTER VALIDATION:', result);

  if (!result.success) {
    const errors: Record<string, string> = {};

    result.error.errors.forEach((err) => {
      const field = err.path[0] as string;

      if (!errors[field]) {
        errors[field] = err.message;
      }
    });

    console.log('REGISTER VALIDATION ERRORS:', errors);

    setFieldErrors(errors);
    return;
  }

  setLoading(true);

  try {
    console.log('CALLING SUPABASE REGISTER...');

    await registerCustomer(
      result.data.email,
      result.data.password,
      result.data.fullName,
      result.data.phoneNumber
    );

    console.log('REGISTER SUCCESS');

    setSuccess(true);
  } catch (err: unknown) {
    console.error('REGISTER ERROR:', err);

    setError(getAuthErrorMessage(err));
  } finally {
    setLoading(false);
  }
}
  // async function handleSubmit(e: React.FormEvent) {
  //   e.preventDefault();
  //   setError(null);
  //   setFieldErrors({});

  //   const result = registerSchema.safeParse(formData);
  //   if (!result.success) {
  //     const errors: Record<string, string> = {};
  //     result.error.errors.forEach((err) => {
  //       const field = err.path[0] as string;
  //       if (!errors[field]) {
  //         errors[field] = err.message;
  //       }
  //     });
  //     setFieldErrors(errors);
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     await registerCustomer(
  //       result.data.email,
  //       result.data.password,
  //       result.data.fullName,
  //       result.data.phoneNumber
  //     );
  //     setSuccess(true);
  //   } catch (err: unknown) {
  //     setError(getAuthErrorMessage(err));
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  // Success State
  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950" />
        <div className="relative w-full max-w-md rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl shadow-black/20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Registrasi Berhasil!</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Silakan cek email untuk verifikasi. Setelah verifikasi, Anda bisa langsung masuk ke akun Anda.
          </p>
          <Link
            to="/login"
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200',
              'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700',
              'focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-2 focus:ring-offset-slate-950'
            )}
          >
            Masuk ke Akun
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-slate-950 to-emerald-950/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-slate-950 to-transparent" />

        <div className="relative z-10 max-w-md px-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
            <Trees className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Bergabung Sekarang
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Daftarkan diri Anda dan mulai jelajahi keindahan alam Panbil Nature Reserve.
          </p>
          <div className="mt-10 flex items-center justify-center gap-2 text-emerald-400/60">
            <div className="h-px w-12 bg-emerald-500/30" />
            <Trees className="w-4 h-4" />
            <div className="h-px w-12 bg-emerald-500/30" />
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Trees className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-xl font-bold text-white">Panbil Nature Reserve</span>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl shadow-black/20">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Daftar Akun</h2>
              <p className="text-slate-400">
                Buat akun baru untuk mulai menjelajahi
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nama lengkap Anda"
                    className={cn(
                      'w-full rounded-xl bg-white/5 border pl-10 pr-4 py-3 text-white placeholder-slate-500 outline-none transition-all duration-200',
                      'focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50',
                      fieldErrors.fullName
                        ? 'border-red-500/50'
                        : 'border-white/10 hover:border-white/20'
                    )}
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.fullName}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  Alamat Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Mail className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="nama@email.com"
                    className={cn(
                      'w-full rounded-xl bg-white/5 border pl-10 pr-4 py-3 text-white placeholder-slate-500 outline-none transition-all duration-200',
                      'focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50',
                      fieldErrors.email
                        ? 'border-red-500/50'
                        : 'border-white/10 hover:border-white/20'
                    )}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-slate-300"
                >
                  Nomor WhatsApp / Telepon
                </label>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Phone className="w-4 h-4 text-slate-500" />
                  </div>

                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="08xxxxxxxxxx"
                    className={cn(
                      'w-full rounded-xl bg-white/5 border pl-10 pr-4 py-3 text-white placeholder-slate-500 outline-none transition-all duration-200',
                      'focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50',
                      fieldErrors.phoneNumber
                        ? 'border-red-500/50'
                        : 'border-white/10 hover:border-white/20'
                    )}
                  />
                </div>

                {fieldErrors.phoneNumber && (
                  <p className="text-xs text-red-400 mt-1">
                    {fieldErrors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={cn(
                      'w-full rounded-xl bg-white/5 border pl-10 pr-4 py-3 text-white placeholder-slate-500 outline-none transition-all duration-200',
                      'focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50',
                      fieldErrors.password
                        ? 'border-red-500/50'
                        : 'border-white/10 hover:border-white/20'
                    )}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka.
                </p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={cn(
                      'w-full rounded-xl bg-white/5 border pl-10 pr-4 py-3 text-white placeholder-slate-500 outline-none transition-all duration-200',
                      'focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50',
                      fieldErrors.confirmPassword
                        ? 'border-red-500/50'
                        : 'border-white/10 hover:border-white/20'
                    )}
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200',
                  'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-2 focus:ring-offset-slate-950',
                  'disabled:opacity-60 disabled:cursor-not-allowed'
                )}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {loading ? 'Memproses...' : 'Daftar'}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-slate-400">
                Sudah punya akun?{' '}
                <Link
                  to="/login"
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Masuk
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
