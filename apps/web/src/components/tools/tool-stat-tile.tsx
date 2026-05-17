export function ToolStatTile({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <div className="flex min-h-[118px] flex-col justify-between rounded-xl border border-slate-200/80 bg-white/[0.86] px-5 py-4 shadow-[0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div>
        <div className="text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
        <div className="mt-2 text-sm text-muted-foreground">{helper}</div>
      </div>
    </div>
  );
}
