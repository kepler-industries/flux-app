import * as React from 'react';
import { Pressable, type PressableProps, View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-xl active:opacity-90',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-secondary',
        outline: 'border border-border bg-transparent',
        ghost: 'bg-transparent',
        destructive: 'bg-destructive',
      },
      size: {
        default: 'h-12 px-5',
        sm: 'h-9 px-3',
        lg: 'h-14 px-7',
        icon: 'h-12 w-12',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: { variant: 'default', size: 'default', fullWidth: false },
  },
);

export type ButtonProps = PressableProps &
  VariantProps<typeof buttonVariants> & {
    disabled?: boolean;
    accessibilityLabel?: string;
  };

export const Button = React.forwardRef<View, ButtonProps>(function Button(
  { className, variant, size, fullWidth, disabled, children, ...rest },
  ref,
) {
  return (
    <Pressable
      ref={ref as React.RefObject<View>}
      accessibilityRole="button"
      disabled={disabled}
      className={cn(
        buttonVariants({ variant, size, fullWidth }),
        disabled && 'opacity-50',
        className as string,
      )}
      // Ensure ≥44pt hit area on iOS for accessibility (we already meet that with h-12).
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      {...rest}
    >
      {children}
    </Pressable>
  );
});
