import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Loader2, Trees, ArrowRight } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { login, getAuthErrorMessage } from '@/features/auth/services/auth.service';
import { loginSchema } from '@/features/auth/validation/auth.schema';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Masuk - Panbil Nature Reserve';
  }, []);

  useEffect(() => {
    if (user) {
      redirectByRole(user.role);
    }
  }, [user]);

  function redirectByRole(role: string) {
    switch (role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        navigate('/admin', { replace: true });
        break;
      case 'STAFF':
        navigate('/staff', { replace: true });
        break;
      case 'CUSTOMER':
      default:
        navigate('/dashboard', { replace: true });
        break;
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await login(
        result.data.email,
        result.data.password
      );
      // if (response.user.role) {
      //   redirectByRole(response.user.role);
      // }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
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
            Selamat Datang Kembali
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Masuk ke akun Anda dan jelajahi keindahan alam Panbil Nature Reserve.
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
              <h2 className="text-2xl font-bold text-white mb-2">Masuk</h2>
              <p className="text-slate-400">
                Masukkan kredensial Anda untuk melanjutkan
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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
                    autoComplete="current-password"
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
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Lupa kata sandi?
                </Link>
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
                  <LogIn className="w-4 h-4" />
                )}
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-slate-400">
                Belum punya akun?{' '}
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Daftar
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
