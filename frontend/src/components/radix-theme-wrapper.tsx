'use client';

import { useTheme } from '@/contexts/theme-context';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';

export default function RadixThemeWrapper({ children }: { children: React.ReactNode }) {
  const { isModern, colorMode } = useTheme();

  if (!isModern) {
    return <>{children}</>;
  }

  return (
    <Theme
      appearance={colorMode}
      accentColor="blue"
      grayColor="slate"
      radius="medium"
      scaling="100%"
    >
      {children}
    </Theme>
  );
}
