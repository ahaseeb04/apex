'use client'

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react'
import { themes, defaultTheme, type Theme, type ThemeColors } from '@/lib/themes'

const STORAGE_KEY = 'coach-theme'

function getStoredThemeId(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(STORAGE_KEY)
}

function getLuminance(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    return 0.299 * r + 0.587 * g + 0.114 * b
}

function isDark(colors: ThemeColors): boolean {
    return getLuminance(colors.surface) < 0.5
}

function primaryForeground(accent: string): string {
    return getLuminance(accent) < 0.5 ? '#FFFFFF' : '#000000'
}

function applyTheme(theme: Theme) {
    const c = theme.colors
    const dark = isDark(c)
    const pf = primaryForeground(c.accent)
    const root = document.documentElement

    if (dark) {
        root.classList.add('dark')
    } else {
        root.classList.remove('dark')
    }

    const vars: Record<string, string> = {
        '--background': c.surface,
        '--foreground': c.label,
        '--card': c.surfaceSecondary,
        '--card-foreground': c.label,
        '--popover': c.surfaceSecondary,
        '--popover-foreground': c.label,
        '--primary': c.accent,
        '--primary-foreground': pf,
        '--secondary': c.surfaceTertiary,
        '--secondary-foreground': c.label,
        '--muted': c.surfaceTertiary,
        '--muted-foreground': c.labelSecondary,
        '--accent': c.surfaceTertiary,
        '--accent-foreground': c.label,
        '--destructive': c.error,
        '--border': c.border,
        '--input': c.border,
        '--ring': c.accent,
        '--sidebar': c.surface,
        '--sidebar-foreground': c.label,
        '--sidebar-primary': c.accent,
        '--sidebar-primary-foreground': pf,
        '--sidebar-accent': c.surfaceTertiary,
        '--sidebar-accent-foreground': c.label,
        '--sidebar-border': c.border,
        '--sidebar-ring': c.accent,
        '--chart-1': c.accent,
        '--chart-2': c.success,
        '--chart-3': c.info,
        '--chart-4': c.labelTertiary,
        '--chart-5': c.surfaceTertiary,
    }

    for (const [key, value] of Object.entries(vars)) {
        root.style.setProperty(key, value)
    }
}

interface ThemeContextValue {
    theme: Theme
    setThemeId: (id: string) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(defaultTheme)

    useEffect(() => {
        const stored = getStoredThemeId()
        const initial = stored
            ? themes.find((t) => t.id === stored) ?? defaultTheme
            : defaultTheme
        applyTheme(initial)
        queueMicrotask(() => setTheme(initial))
    }, [])

    useEffect(() => {
        applyTheme(theme)
    }, [theme])

    function setThemeId(id: string) {
        const next = themes.find((t) => t.id === id) ?? defaultTheme
        localStorage.setItem(STORAGE_KEY, id)
        setTheme(next)
    }

    return (
        <ThemeContext.Provider value={{ theme, setThemeId }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
    return ctx
}
