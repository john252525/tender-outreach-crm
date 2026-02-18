'use client';

import { useTheme } from '@/contexts/theme-context';
import { Sun, Moon, Palette } from 'lucide-react';
import { clsx } from 'clsx';
import type { UserSettings } from '@/types';

interface ThemeSwitcherProps {
  onSettingsChange?: (settings: UserSettings) => void;
}

export default function ThemeSwitcher({ onSettingsChange }: ThemeSwitcherProps) {
  const { theme, colorMode, setTheme, setColorMode } = useTheme();

  return (
    <div className="px-3 py-3 space-y-2">
      {/* Theme variant toggle */}
      <div className="flex items-center gap-2">
        <Palette size={14} className="text-gray-400 flex-shrink-0" />
        <div className="flex rounded-lg overflow-hidden border border-white/10 flex-1">
          <button
            onClick={() => { setTheme('classic'); onSettingsChange?.({ theme: 'classic', colorMode }); }}
            className={clsx(
              'flex-1 text-xs py-1.5 px-2 transition-colors',
              theme === 'classic'
                ? 'bg-sidebar-active text-white'
                : 'text-gray-400 hover:text-white hover:bg-sidebar-hover'
            )}
          >
            Classic
          </button>
          <button
            onClick={() => { setTheme('modern'); onSettingsChange?.({ theme: 'modern', colorMode }); }}
            className={clsx(
              'flex-1 text-xs py-1.5 px-2 transition-colors',
              theme === 'modern'
                ? 'bg-sidebar-active text-white'
                : 'text-gray-400 hover:text-white hover:bg-sidebar-hover'
            )}
          >
            Modern
          </button>
        </div>
      </div>

      {/* Color mode toggle */}
      <div className="flex items-center gap-2">
        {colorMode === 'light' ? (
          <Sun size={14} className="text-gray-400 flex-shrink-0" />
        ) : (
          <Moon size={14} className="text-gray-400 flex-shrink-0" />
        )}
        <div className="flex rounded-lg overflow-hidden border border-white/10 flex-1">
          <button
            onClick={() => { setColorMode('light'); onSettingsChange?.({ theme, colorMode: 'light' }); }}
            className={clsx(
              'flex-1 text-xs py-1.5 px-2 transition-colors',
              colorMode === 'light'
                ? 'bg-sidebar-active text-white'
                : 'text-gray-400 hover:text-white hover:bg-sidebar-hover'
            )}
          >
            Light
          </button>
          <button
            onClick={() => { setColorMode('dark'); onSettingsChange?.({ theme, colorMode: 'dark' }); }}
            className={clsx(
              'flex-1 text-xs py-1.5 px-2 transition-colors',
              colorMode === 'dark'
                ? 'bg-sidebar-active text-white'
                : 'text-gray-400 hover:text-white hover:bg-sidebar-hover'
            )}
          >
            Dark
          </button>
        </div>
      </div>
    </div>
  );
}
