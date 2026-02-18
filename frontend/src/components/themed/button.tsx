'use client';

import { useTheme } from '@/contexts/theme-context';
import { Button as RadixButton } from '@radix-ui/themes';
import { clsx } from 'clsx';

type Variant = 'primary' | 'secondary' | 'danger';

interface ThemedButtonProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const classicStyles: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
};

const radixVariants: Record<Variant, { color: 'blue' | 'gray' | 'red'; variant: 'solid' | 'outline' }> = {
  primary: { color: 'blue', variant: 'solid' },
  secondary: { color: 'gray', variant: 'outline' },
  danger: { color: 'red', variant: 'solid' },
};

export default function ThemedButton({
  variant = 'primary',
  children,
  className,
  disabled,
  onClick,
  type = 'button',
}: ThemedButtonProps) {
  const { isModern } = useTheme();

  if (isModern) {
    const rv = radixVariants[variant];
    return (
      <RadixButton
        color={rv.color}
        variant={rv.variant}
        disabled={disabled}
        onClick={onClick}
        type={type}
        className={className}
        size="2"
      >
        {children}
      </RadixButton>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={clsx(classicStyles[variant], className)}
    >
      {children}
    </button>
  );
}
