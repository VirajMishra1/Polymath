'use client';

import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { KeyboardShortcutsHelp } from '@/components/keyboard-shortcuts-help';

export function GlobalKeyboardHandler() {
  useKeyboardShortcuts();
  return <KeyboardShortcutsHelp />;
}
