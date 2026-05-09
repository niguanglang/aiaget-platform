export function CustomerSuccessActionBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute left-8 top-6 h-64 w-64 rounded-full bg-emerald-200/20 blur-3xl" />
      <div className="absolute right-8 top-24 h-72 w-72 rounded-full bg-sky-200/20 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:42px_42px] opacity-40" />
    </div>
  );
}
