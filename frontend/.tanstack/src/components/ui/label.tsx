import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/cn';

interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {}

export function Label({ className, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      className={cn('text-sm font-medium text-gray-700', className)}
      {...props}
    />
  );
}
