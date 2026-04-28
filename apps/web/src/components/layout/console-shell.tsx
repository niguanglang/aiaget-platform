import { ConsoleAuthGuard } from '@/components/auth/console-auth-guard';
import { AuthProvider } from '@/components/auth/auth-provider';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { QueryProvider } from '@/components/providers/query-provider';

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryProvider>
        <ConsoleAuthGuard>
          <div className="flex min-h-screen bg-muted/30">
            <Sidebar />
            <div className="min-w-0 flex-1">
              <Topbar />
              <MobileNav />
              {children}
            </div>
          </div>
        </ConsoleAuthGuard>
      </QueryProvider>
    </AuthProvider>
  );
}
