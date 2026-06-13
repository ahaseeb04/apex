'use client'

import { ThemeProvider } from '@/hooks/use-theme'
import { FontProvider } from '@/hooks/use-font'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <FontProvider>
            <ThemeProvider>{children}</ThemeProvider>
        </FontProvider>
    )
}
