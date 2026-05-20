import * as React from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/utils';

export function Progress({ value, className, tone = 'primary' }: { value: number; className?: string; tone?: 'primary' | 'success' | 'warning' | 'destructive' }) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(clamped * 100), min: 0, max: 100 }}
      className={cn('h-2 w-full rounded-full bg-secondary overflow-hidden', className)}
    >
      <View
        className={cn(
          'h-full rounded-full',
          tone === 'primary' && 'bg-primary',
          tone === 'success' && 'bg-success',
          tone === 'warning' && 'bg-warning',
          tone === 'destructive' && 'bg-destructive',
        )}
        style={{ width: `${clamped * 100}%` }}
      />
    </View>
  );
}
