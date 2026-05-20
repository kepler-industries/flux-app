import * as React from 'react';
import { Text as RNText, type TextProps } from 'react-native';
import { cn } from '@/lib/utils';

export type AppTextProps = TextProps & {
  variant?: 'default' | 'muted' | 'heading' | 'title' | 'label' | 'destructive';
};

export const Text = React.forwardRef<RNText, AppTextProps>(function Text(
  { className, variant = 'default', ...rest },
  ref,
) {
  return (
    <RNText
      ref={ref}
      className={cn(
        'text-foreground',
        variant === 'muted' && 'text-muted-foreground text-sm',
        variant === 'heading' && 'text-3xl font-semibold tracking-tight',
        variant === 'title' && 'text-xl font-semibold',
        variant === 'label' && 'text-sm font-medium text-muted-foreground',
        variant === 'destructive' && 'text-destructive',
        className,
      )}
      {...rest}
    />
  );
});
