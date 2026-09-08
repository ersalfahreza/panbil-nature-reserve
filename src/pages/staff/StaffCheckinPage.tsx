import { cn } from '@/lib/utils';
import { ScanLine, QrCode, Camera } from 'lucide-react';

export default function StaffCheckinPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white md:text-3xl">
        Gate Check-in
      </h1>

      {/* Placeholder Card */}
      <div
        className={cn(
          'rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur',
          'flex flex-col items-center justify-center px-6 py-20 text-center'
        )}
      >
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-sky-500/10 ring-1 ring-sky-500/20">
            <ScanLine className="h-10 w-10 text-sky-400" />
          </div>
          <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 ring-2 ring-slate-900">
            <Camera className="h-4 w-4 text-slate-500" />
          </div>
        </div>
        <h2 className="mt-6 text-lg font-semibold text-white">
          QR Scanner akan tersedia di phase berikutnya
        </h2>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Fitur pemindaian QR code untuk check-in pengunjung sedang dalam
          pengembangan dan akan segera tersedia.
        </p>
        <div className="mt-6 flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/5 px-4 py-2">
          <QrCode className="h-4 w-4 text-sky-400" />
          <span className="text-sm text-sky-300">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}
