import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-primary)] text-white',
        secondary: 'bg-gray-100 text-gray-700',
        outline: 'border border-gray-300 text-gray-700',
        destructive: 'bg-red-100 text-red-700',
        pending: 'bg-amber-100 text-amber-700',
        confirmed: 'bg-blue-100 text-blue-700',
        checked_in: 'bg-purple-100 text-purple-700',
        in_progress: 'bg-emerald-100 text-emerald-700',
        completed: 'bg-gray-100 text-gray-600',
        cancelled: 'bg-red-100 text-red-600',
        no_show: 'bg-gray-100 text-gray-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
