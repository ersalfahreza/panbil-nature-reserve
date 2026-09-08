import { cn } from '@/lib/utils';
import { Ticket, QrCode } from 'lucide-react';

export default function CustomerTicketsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white md:text-3xl">Tiket Saya</h1>

      {/* Empty State */}
      <div
        className={cn(
          'rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur',
          'flex flex-col items-center justify-center px-6 py-20 text-center'
        )}
      >
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <Ticket className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 ring-2 ring-slate-900">
            <QrCode className="h-4 w-4 text-slate-500" />
          </div>
        </div>
        <h2 className="mt-5 text-lg font-semibold text-white">
          Belum ada tiket aktif
        </h2>
        <p className="mt-2 max-w-sm text-sm text-slate-400">
          Tiket Anda akan muncul di sini setelah Anda melakukan reservasi dan
          pembayaran.
        </p>
      </div>
    </div>
  );
}
