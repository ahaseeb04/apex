'use client'

import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeSheet } from '@/components/theme-sheet'

export function AppHeader({
    title,
    onSignOut,
    backHref,
}: {
    title: string
    onSignOut: () => void
    backHref?: string
}) {
    return (
        <header className="sticky top-0 z-10 border-b border-border bg-background">
            <div className="mx-auto flex h-16 max-w-2xl items-center gap-4 px-6">
                <div className="flex-1 flex items-center">
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
                </div>
                <div className="flex-1 flex items-center justify-end gap-x-2">
                    <ThemeSheet />
                    <Button variant="outline" onClick={onSignOut}>
                        Sign Out
                    </Button>
                </div>
            </div>
        </header>
    )
}
