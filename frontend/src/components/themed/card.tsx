'use client';

import { useTheme } from '@/contexts/theme-context';
import { Card as RadixCard } from '@radix-ui/themes';
import { clsx } from 'clsx';

interface ThemedCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function ThemedCard({ children, className }: ThemedCardProps) {
  const { isModern } = useTheme();

  if (isModern) {
    return (
      <RadixCard size="3" className={className}>
        {children}
      </RadixCard>
    );
  }

  return (
    <div className={clsx('card', className)}>
      {children}
    </div>
  );
}
