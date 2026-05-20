import * as React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<TextInput, TextInputProps>(function Input(
  { className, placeholderTextColor, ...rest },
  ref,
) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={placeholderTextColor ?? 'hsl(220 9% 50%)'}
      className={cn(
        'h-12 rounded-xl border border-input bg-card px-4 text-base text-foreground',
        'focus:border-ring',
        className,
      )}
      {...rest}
    />
  );
});
