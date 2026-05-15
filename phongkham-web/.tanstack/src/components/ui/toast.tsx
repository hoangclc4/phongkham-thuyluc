import * as ToastPrimitive from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { ToastVariant } from '@/hooks/use-toast';

export const ToastProvider = ToastPrimitive.Provider;
export const ToastViewport = ToastPrimitive.Viewport;

interface ToastProps extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> {
  variant?: ToastVariant;
}

export function Toast({ className, variant = 'default', ...props }: ToastProps) {
  return (
    <ToastPrimitive.Root
      className={cn(
        'group pointer-events-auto relative flex w-full items-center justify-between gap-3',
        'overflow-hidden rounded-lg border p-4 shadow-lg transition-all',
        'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
        'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[swipe=end]:animate-out data-[state=closed]:fade-out-80',
        'data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full',
        variant === 'default' && 'bg-white border-gray-200 text-gray-900',
        variant === 'destructive' && 'bg-red-600 border-red-600 text-white',
        className,
      )}
      {...props}
    />
  );
}

export function ToastTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>) {
  return (
    <ToastPrimitive.Title
      className={cn('text-sm font-semibold', className)}
      {...props}
    />
  );
}

export function ToastDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>) {
  return (
    <ToastPrimitive.Description
      className={cn('text-sm opacity-90', className)}
      {...props}
    />
  );
}

export function ToastClose({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>) {
  return (
    <ToastPrimitive.Close
      className={cn(
        'absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity',
        'group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2',
        className,
      )}
      toast-close=""
      {...props}
    >
      <X className="h-4 w-4" />
    </ToastPrimitive.Close>
  );
}
