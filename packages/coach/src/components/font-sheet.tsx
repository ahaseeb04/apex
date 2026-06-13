'use client'

import { useRef, useState } from 'react'
import { Check, TypeIcon } from 'lucide-react'
import { useFont, fonts, type FontId } from '@/hooks/use-font'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function FontSheet() {
    const { font: active, setFontId } = useFont()
    const fontRefs = useRef<(HTMLButtonElement | null)[]>([])

    const [activeIndex, setActiveIndex] = useState(
        fonts.findIndex((f) => f.id === active.id),
    )

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return

        e.preventDefault()

        const nextIndex =
            e.key === 'ArrowDown'
                ? Math.min(activeIndex + 1, fonts.length - 1)
                : Math.max(activeIndex - 1, 0)

        setActiveIndex(nextIndex)

        const nextFont = fonts[nextIndex]
        setFontId(nextFont.id as FontId)

        fontRefs.current[nextIndex]?.focus()
        fontRefs.current[nextIndex]?.scrollIntoView({
            block: 'nearest',
        })
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                    <TypeIcon className="size-4" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="px-5 sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Font</SheetTitle>
                    <SheetDescription>Choose a font for the app</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-2" onKeyDown={handleKeyDown}>
                    {fonts.map((font, index) => {
                        const isActive = index === activeIndex
                        return (
                            <button
                                key={font.id}
                                ref={(el) => {
                                    fontRefs.current[index] = el
                                }}
                                tabIndex={isActive ? 0 : -1}
                                type="button"
                                onClick={() => {
                                    setActiveIndex(index)
                                    setFontId(font.id as FontId)
                                }}
                                className={cn(
                                    'flex items-center justify-between rounded-xl p-4 text-left transition-colors focus:outline-none',
                                    isActive
                                        ? 'ring-2 ring-(--accent-color)'
                                        : 'ring-1 ring-border hover:bg-muted/50',
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex size-10 items-center justify-center rounded-lg bg-muted"
                                        style={{ fontFamily: `var(${font.variable})` }}
                                    >
                                        <span className="text-lg font-semibold">Aa</span>
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-medium"
                                            style={{ fontFamily: `var(${font.variable})` }}
                                        >
                                            {font.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            The quick brown fox jumps over the lazy dog
                                        </p>
                                    </div>
                                </div>
                                {isActive && <Check className="size-5" />}
                            </button>
                        )
                    })}
                </div>
            </SheetContent>
        </Sheet>
    )
}
