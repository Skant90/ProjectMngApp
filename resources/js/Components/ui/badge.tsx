import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
    {
        variants: {
            variant: {
                default: 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300',
                secondary: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
                destructive: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                success: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                warning: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
                outline: 'border border-gray-300 text-gray-700',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
