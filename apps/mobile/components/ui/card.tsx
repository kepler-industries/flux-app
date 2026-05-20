import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<View, ViewProps>(function Card(
  { className, ...rest },
  ref,
) {
  return (
    <View
      ref={ref}
      className={cn('rounded-2xl bg-card border border-border p-4', className)}
      {...rest}
    />
  );
});

export const CardHeader = React.forwardRef<View, ViewProps>(function CardHeader(
  { className, ...rest },
  ref,
) {
  return <View ref={ref} className={cn('mb-3', className)} {...rest} />;
});

export const CardFooter = React.forwardRef<View, ViewProps>(function CardFooter(
  { className, ...rest },
  ref,
) {
  return <View ref={ref} className={cn('mt-3', className)} {...rest} />;
});
