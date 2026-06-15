import type { Metadata } from 'next'
import { Inter, Google_Sans, DM_Sans } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const googleSans = Google_Sans({
    subsets: ['latin'],
    variable: '--font-google-sans',
    weight: ['400', '500', '600', '700'],
    adjustFontFallback: false,
})

const dmSans = DM_Sans({
    subsets: ['latin'],
    variable: '--font-dm-sans',
    weight: ['400', '500', '600', '700'],
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
                'font-sans',
                inter.variable,
                googleSans.variable,
                dmSans.variable,
            )}
        >
            <head>
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Proxima+Nova:wght@400;600;700&display=swap"
                />
            </head>
            <body className="min-h-full flex flex-col">
                <Providers>{children}</Providers>
                <Toaster />
            </body>
        </html>
    )
}
