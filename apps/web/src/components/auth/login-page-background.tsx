export function LoginPageBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/login/reference-background.png')" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.02)_44%,rgba(255,255,255,0.06)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(255,255,255,0.42),transparent_20%),radial-gradient(circle_at_80%_14%,rgba(164,194,255,0.22),transparent_22%),radial-gradient(circle_at_68%_82%,rgba(255,255,255,0.22),transparent_18%)]" />
    </div>
  );
}
