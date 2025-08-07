import { useEffect, useCallback } from 'react'

interface ShortcutConfig {
  key: string
  ctrl?: boolean
  cmd?: boolean
  shift?: boolean
  alt?: boolean
  handler: () => void
  description?: string
  preventDefault?: boolean
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const matchesCtrl = !shortcut.ctrl || event.ctrlKey === shortcut.ctrl
      const matchesCmd = !shortcut.cmd || event.metaKey === shortcut.cmd
      const matchesShift = !shortcut.shift || event.shiftKey === shortcut.shift
      const matchesAlt = !shortcut.alt || event.altKey === shortcut.alt
      
      if (matchesKey && matchesCtrl && matchesCmd && matchesShift && matchesAlt) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault()
        }
        
        requestAnimationFrame(() => {
          shortcut.handler()
        })
        
        break
      }
    }
  }, [shortcuts])
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}