'use client';

import { useTheme } from '@/contexts/theme-context';
import { TextField } from '@radix-ui/themes';
import { clsx } from 'clsx';

type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url' | 'date' | 'time' | 'hidden';

interface ThemedInputProps {
  type?: InputType;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
}

export default function ThemedInput({
  type = 'text',
  value,
  onChange,
  placeholder,
  className,
  required,
  disabled,
  id,
  name,
}: ThemedInputProps) {
  const { isModern } = useTheme();

  if (isModern) {
    return (
      <TextField.Root
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        id={id}
        name={name}
        size="2"
        className={className}
      />
    );
  }

  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      id={id}
      name={name}
      className={clsx('input-field', className)}
    />
  );
}
