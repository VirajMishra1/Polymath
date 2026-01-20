'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTerminalStore } from '@/lib/store';

export function useKeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const { keyboardShortcutsEnabled, setActivePanel } = useTerminalStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!keyboardShortcutsEnabled) return;

    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    
    if (isInput) return;

    switch (e.key.toLowerCase()) {
      case 'g':
        if (e.shiftKey) return;
        e.preventDefault();
        router.push('/');
        break;

      case '?':
        e.preventDefault();
        break;

      case '1':
        if (pathname.startsWith('/market/')) {
          e.preventDefault();
          setActivePanel('analysis');
        }
        break;

      case '2':
        if (pathname.startsWith('/market/')) {
          e.preventDefault();
          setActivePanel('scenario');
        }
        break;

      case '3':
        if (pathname.startsWith('/market/')) {
          e.preventDefault();
          setActivePanel('montecarlo');
        }
        break;

      case '4':
        if (pathname.startsWith('/market/')) {
          e.preventDefault();
          setActivePanel('hedge');
        }
        break;
    }
  }, [keyboardShortcutsEnabled, router, pathname, setActivePanel]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
