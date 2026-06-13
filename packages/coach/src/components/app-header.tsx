'use client'

import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeSheet } from '@/components/theme-sheet'

export function AppHeader({
    title,
    email,
    onSignOut,
    backHref,
    hideEmailOnMobile = false,
}: {
    title: string
    email: string
    onSignOut: () => void
    backHref?: string
    hideEmailOnMobile?: boolean
}) {
    return (
        <header className="sticky top-0 z-10 border-b border-border bg-background">
            <div className="mx-auto flex h-16 max-w-2xl items-center gap-4 px-6">
                {backHref ? (
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={backHref}>
                            <ArrowLeftIcon className="size-4" />
                        </Link>
                    </Button>
                ) : null}
                <h1
                    className={
                        backHref
                            ? 'flex-1 text-base font-semibold tracking-tight truncate'
                            : 'text-base font-semibold tracking-tight'
                    }
                >
                    {title}
                </h1>
                <span
                    className={
                        hideEmailOnMobile
                            ? 'text-sm text-muted-foreground hidden sm:inline'
                            : 'text-sm text-muted-foreground'
                    }
                >
                    {email}
                </span>
                <ThemeSheet />
                <Button variant="outline" onClick={onSignOut}>
                    Sign Out
                </Button>
            </div>
        </header>
    )
}
