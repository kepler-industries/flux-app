import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export const Badge = React.forwardRef<View, ViewProps & { tone?: 'default' | 'success' | 'warning' | 'destructive' }>(
  function Badge({ className, tone = 'default', ...rest }, ref) {
    return (
      <View
        ref={ref}
        className={cn(
          'rounded-full px-2.5 py-1 self-start',
          tone === 'default' && 'bg-secondary',
          tone === 'success' && 'bg-success/20',
          tone === 'warning' && 'bg-warning/20',
          tone === 'destructive' && 'bg-destructive/20',
          className,
        )}
        {...rest}
      />
    );
  },
);
