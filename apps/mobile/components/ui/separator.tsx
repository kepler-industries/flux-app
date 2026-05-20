import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export function Separator({ className, ...rest }: ViewProps) {
  return <View className={cn('h-px bg-border w-full my-2', className)} {...rest} />;
}
