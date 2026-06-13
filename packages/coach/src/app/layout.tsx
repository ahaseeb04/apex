import type { Metadata } from 'next'
import { Geist, Geist_Mono, Inter, Google_Sans } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/sonner'
import { FontProvider } from '@/hooks/use-font'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const googleSans = Google_Sans({
    subsets: ['latin'],
    variable: '--font-google-sans',
    weight: ['400', '500', '600', '700'],
})

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

export const metadata: Metadata = {
    title: 'Coach',
    description: 'Coach platform — manage your athletes',
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html
            lang="en"
            className={cn(
                'dark',
                'h-full',
                'antialiased',
                geistSans.variable,
                'font-sans',
                inter.variable,
                googleSans.variable,
            )}
        >
            <body className="min-h-full flex flex-col">
                <FontProvider>
                    <Providers>{children}</Providers>
                    <Toaster />
                </FontProvider>
            </body>
        </html>
    )
}
