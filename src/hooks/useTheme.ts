import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const storageKey = 'devdeck-theme'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem(storageKey) as Theme | null) ?? 'system')

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const isDark = theme === 'dark' || (theme === 'system' && media.matches)
      document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
    }

    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  const setTheme = (value: Theme) => {
    setThemeState(value)
    localStorage.setItem(storageKey, value)
  }

  return { theme, setTheme }
}
