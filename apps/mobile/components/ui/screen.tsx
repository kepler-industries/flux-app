import * as React from 'react';
import { View, ScrollView, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';

export function Screen({ className, children, ...rest }: ViewProps) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className={cn('flex-1 px-5 pt-2', className)} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}

export function ScrollScreen({
  className,
  children,
  contentClassName,
  ...rest
}: ViewProps & { contentClassName?: string }) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView
        className={cn('flex-1', className)}
        contentContainerClassName={cn('px-5 pt-2 pb-24', contentClassName)}
        keyboardShouldPersistTaps="handled"
        {...rest}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
