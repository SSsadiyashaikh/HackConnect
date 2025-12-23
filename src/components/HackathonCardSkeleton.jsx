const HackathonCardSkeleton = () => {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-100 bg-white/60 p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="h-4 w-2/3 rounded bg-slate-200" />
        <div className="h-5 w-16 rounded-full bg-slate-200" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 w-full rounded bg-slate-200" />
        <div className="h-3 w-5/6 rounded bg-slate-200" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 w-3/4 rounded bg-slate-200" />
        <div className="h-3 w-2/3 rounded bg-slate-200" />
        <div className="h-3 w-1/2 rounded bg-slate-200" />
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-5 w-16 rounded-full bg-slate-200" />
        <div className="h-5 w-20 rounded-full bg-slate-200" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 flex-1 rounded-lg bg-slate-200" />
        <div className="h-9 flex-1 rounded-lg bg-slate-100" />
      </div>
    </div>
  );
};

export default HackathonCardSkeleton;
