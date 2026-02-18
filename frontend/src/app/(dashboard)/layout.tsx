'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/theme-context';
import Sidebar from '@/components/sidebar';
import { Role } from '@/types';
import type { UserSettings } from '@/types';
import { api } from '@/lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const { setTheme, setColorMode } = useTheme();
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Sync user settings from backend into theme context on login
  useEffect(() => {
    if (user?.settings) {
      if (user.settings.theme) setTheme(user.settings.theme);
      if (user.settings.colorMode) setColorMode(user.settings.colorMode);
    }
  }, [user?.settings?.theme, user?.settings?.colorMode, setTheme, setColorMode]);

  // Persist theme changes to backend (debounced)
  const handleSettingsChange = useCallback(
    (settings: UserSettings) => {
      if (!user) return;
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        try {
          await api.patch(`/users/${user.id}`, { settings });
        } catch (err) {
          console.error('Failed to save theme settings:', err);
        }
      }, 500);
    },
    [user],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={{
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role as Role,
        }}
        onLogout={logout}
        onSettingsChange={handleSettingsChange}
      />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
