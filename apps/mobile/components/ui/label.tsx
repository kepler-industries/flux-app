import * as React from 'react';
import { Text as RNText, type TextProps } from 'react-native';
import { cn } from '@/lib/utils';

export const Label = React.forwardRef<RNText, TextProps>(function Label(
  { className, ...rest },
  ref,
) {
  return (
    <RNText
      ref={ref}
      accessibilityRole="text"
      className={cn('mb-1.5 text-sm font-medium text-muted-foreground', className)}
      {...rest}
    />
  );
});
