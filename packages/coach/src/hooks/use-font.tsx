'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type FontId = 'inter' | 'google-sans'

interface Font {
    id: FontId
    name: string
    variable: string
}

export const fonts: Font[] = [
    { id: 'inter', name: 'Inter', variable: '--font-sans' },
    { id: 'google-sans', name: 'Google Sans', variable: '--font-google-sans' },
]

const STORAGE_KEY = 'coach-font'

function getStoredFontId(): FontId | null {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'inter' || stored === 'google-sans') return stored
    return null
}

function applyFont(font: Font) {
    document.documentElement.style.setProperty(
        '--font-family',
        `var(${font.variable})`,
    )
}

interface FontContextValue {
    font: Font
    setFontId: (id: FontId) => void
}

const FontContext = createContext<FontContextValue | null>(null)

export function FontProvider({ children }: { children: ReactNode }) {
    const [font, setFont] = useState<Font>(fonts[0])

    useEffect(() => {
        const stored = getStoredFontId()
        const initial = stored ? fonts.find((f) => f.id === stored) ?? fonts[0] : fonts[0]
        applyFont(initial)
        queueMicrotask(() => setFont(initial))
    }, [])

    useEffect(() => {
        applyFont(font)
    }, [font])

    function setFontId(id: FontId) {
        const next = fonts.find((f) => f.id === id) ?? fonts[0]
        localStorage.setItem(STORAGE_KEY, id)
        setFont(next)
    }

    return (
        <FontContext.Provider value={{ font, setFontId }}>
            {children}
        </FontContext.Provider>
    )
}

export function useFont() {
    const ctx = useContext(FontContext)
    if (!ctx) throw new Error('useFont must be used within FontProvider')
    return ctx
}
