'use client'

import { ThemeProvider } from '@/hooks/use-theme'

export function Providers({ children }: { children: React.ReactNode }) {
    return <ThemeProvider>{children}</ThemeProvider>
}
