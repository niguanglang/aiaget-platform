'use client';

import { useEffect, useState } from 'react';

import { ConsoleAuthGuard } from '@/components/auth/console-auth-guard';
import { AuthProvider } from '@/components/auth/auth-provider';
import { ConsoleRouteChrome } from '@/components/layout/console-route-chrome';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { QueryProvider } from '@/components/providers/query-provider';

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'AIAget.sidebarCollapsed';

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    setIsSidebarCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true');
  }, []);

  function toggleSidebarCollapsed() {
    setIsSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <AuthProvider>
      <QueryProvider>
        <ConsoleAuthGuard>
          <div className="flex min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#f3f7fb_45%,#f8fafc_100%)]">
            <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapsed={toggleSidebarCollapsed} />
            <div className="min-w-0 flex-1">
              <Topbar />
              <MobileNav />
              <ConsoleRouteChrome />
              {children}
            </div>
          </div>
        </ConsoleAuthGuard>
      </QueryProvider>
    </AuthProvider>
  );
}
