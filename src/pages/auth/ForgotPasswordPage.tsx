import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound, Loader2, Trees, ArrowLeft } from 'lucide-react';
import { resetPassword, getAuthErrorMessage } from '@/features/auth/services/auth.service';
import { resetPasswordSchema } from '@/features/auth/validation/auth.schema';
import { cn } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState({
    email: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title = 'Lupa Kata Sandi - Panbil Nature Reserve';
  }, []);

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

    const result = resetPasswordSchema.safeParse(formData);
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
      await resetPassword(result.data.email);
      setSuccess(true);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      {/* Background Decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Trees className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="text-xl font-bold text-white">Panbil Nature Reserve</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl shadow-black/20">
          {success ? (
            /* Success State */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <Mail className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Email Terkirim</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Link reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam Anda.
              </p>
              <Link
                to="/login"
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-200',
                  'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-2 focus:ring-offset-slate-950'
                )}
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Halaman Masuk
              </Link>
            </div>
          ) : (
            /* Form State */
            <>
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
                  <KeyRound className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Lupa Kata Sandi?</h2>
                <p className="text-slate-400">
                  Masukkan email Anda dan kami akan mengirimkan link untuk mereset kata sandi.
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
                    <Mail className="w-4 h-4" />
                  )}
                  {loading ? 'Mengirim...' : 'Kirim Link Reset'}
                </button>
              </form>

              {/* Back to Login */}
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Kembali ke halaman masuk
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
