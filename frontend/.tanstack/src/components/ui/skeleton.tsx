import { cn } from '@/lib/cn';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('bg-gray-200 animate-pulse rounded-md', className)}
      {...props}
    />
  );
}
