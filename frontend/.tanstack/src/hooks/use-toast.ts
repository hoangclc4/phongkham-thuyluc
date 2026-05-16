import { useState, useCallback } from 'react';

export type ToastVariant = 'default' | 'destructive';

export interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastInput {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

let externalAddToast: ((input: ToastInput) => void) | null = null;

export function toast(input: ToastInput) {
  externalAddToast?.(input);
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((input: ToastInput) => {
    const id = Math.random().toString(36).slice(2);
    const newToast: ToastData = { id, duration: 5000, ...input };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, newToast.duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const registerExternal = useCallback(() => {
    externalAddToast = addToast;
  }, [addToast]);

  return { toasts, addToast, removeToast, registerExternal };
}
