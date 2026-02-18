'use client';

import { ThemeProvider } from '@/contexts/theme-context';
import RadixThemeWrapper from '@/components/radix-theme-wrapper';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <RadixThemeWrapper>
        {children}
      </RadixThemeWrapper>
    </ThemeProvider>
  );
}
