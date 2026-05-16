import { cn } from '@/lib/cn';

type AvatarSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
};

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  const firstWord = words[0] ?? '';
  const lastWord = words.length > 1 ? words[words.length - 1] : '';
  const first = firstWord.charAt(0).toUpperCase();
  const last = lastWord.charAt(0).toUpperCase();
  return last ? `${first}${last}` : first;
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover shrink-0', SIZE_CLASSES[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center shrink-0 font-semibold text-white',
        'bg-[var(--color-primary)]',
        SIZE_CLASSES[size],
        className,
      )}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}
