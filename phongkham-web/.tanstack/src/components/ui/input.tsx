import { cn } from '@/lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)]',
        'placeholder:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  );
}
