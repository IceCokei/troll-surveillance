import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        ok: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
        warn: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
        bad: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
        acc: 'border-violet-500/25 bg-violet-500/10 text-violet-300',
        ghost: 'border-neutral-800 bg-neutral-900/60 text-neutral-400',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
