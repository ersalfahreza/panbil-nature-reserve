import { cn } from '@/lib/utils';
import { Construction } from 'lucide-react';

export default function AdminPlaceholderPage({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white md:text-3xl">{title}</h1>

      <div
        className={cn(
          'rounded-2xl border border-slate-800/50 bg-slate-900/50 backdrop-blur',
          'flex flex-col items-center justify-center px-6 py-20 text-center'
        )}
      >
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
            <Icon className="h-8 w-8 text-amber-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 ring-2 ring-slate-900">
            <Construction className="h-4 w-4 text-amber-500" />
          </div>
        </div>
        <h2 className="mt-5 text-lg font-semibold text-white">{title}</h2>
        <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>
        <div className="mt-6 flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-2">
          <Construction className="h-4 w-4 text-amber-400" />
          <span className="text-sm text-amber-300">
            Fitur ini akan tersedia di phase berikutnya
          </span>
        </div>
      </div>
    </div>
  );
}
