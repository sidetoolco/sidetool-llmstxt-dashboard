import { useEffect, useCallback } from 'react'

interface Shortcut {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
  action: () => void
  description?: string
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return
    }

    shortcuts.forEach(shortcut => {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatch = !shortcut.ctrl || event.ctrlKey === shortcut.ctrl
      const altMatch = !shortcut.alt || event.altKey === shortcut.alt
      const shiftMatch = !shortcut.shift || event.shiftKey === shortcut.shift
      const metaMatch = !shortcut.meta || event.metaKey === shortcut.meta

      if (keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch) {
        event.preventDefault()
        shortcut.action()
      }
    })
  }, [shortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Common shortcuts for the app
export const commonShortcuts = {
  search: { key: '/', description: 'Focus search' },
  newJob: { key: 'n', ctrl: true, description: 'New crawl job' },
  refresh: { key: 'r', ctrl: true, shift: true, description: 'Refresh data' },
  help: { key: '?', description: 'Show help' },
  escape: { key: 'Escape', description: 'Close modal/dialog' },
  save: { key: 's', ctrl: true, description: 'Save' },
  submit: { key: 'Enter', ctrl: true, description: 'Submit form' },
}

// Hook to show keyboard shortcuts help
export function useKeyboardShortcutsHelp() {
  const shortcuts = [
    { keys: ['Ctrl', 'N'], description: 'Start new crawl job' },
    { keys: ['Ctrl', 'Shift', 'R'], description: 'Refresh data' },
    { keys: ['/'], description: 'Focus search' },
    { keys: ['?'], description: 'Show this help' },
    { keys: ['Esc'], description: 'Close dialogs' },
    { keys: ['Ctrl', 'S'], description: 'Save changes' },
    { keys: ['Ctrl', 'Enter'], description: 'Submit form' },
    { keys: ['Tab'], description: 'Navigate forward' },
    { keys: ['Shift', 'Tab'], description: 'Navigate backward' },
  ]

  const formatKeys = (keys: string[]) => {
    return keys.map(key => {
      const formatted = key.replace('Ctrl', '⌘').replace('Shift', '⇧')
      return formatted
    }).join(' + ')
  }

  return { shortcuts, formatKeys }
}