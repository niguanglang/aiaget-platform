'use client';

import { useState } from 'react';

import { ConsoleAuthGuard } from '@/components/auth/console-auth-guard';
import { AuthProvider } from '@/components/auth/auth-provider';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { QueryProvider } from '@/components/providers/query-provider';

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <AuthProvider>
      <QueryProvider>
        <ConsoleAuthGuard>
          <div className="flex min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#f3f7fb_45%,#f8fafc_100%)]">
            <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapsed={() => setIsSidebarCollapsed((current) => !current)} />
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
