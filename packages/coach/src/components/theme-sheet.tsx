'use client'

import { Check } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { themes } from '@/lib/themes'
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
import type { ComponentProps } from 'react'

export function ThemeSheet({ children }: { children?: React.ReactNode }) {
    const { theme: active, setThemeId } = useTheme()

    return (
        <Sheet>
            <SheetTrigger asChild>
                {children ?? (
                    <Button variant="ghost" size="icon-sm">
                        <span
                            className="size-5 rounded-full border border-border"
                            style={{ backgroundColor: active.colors.accent }}
                        />
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="right" className="px-5 sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Appearance</SheetTitle>
                    <SheetDescription>Choose a theme for the app</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-2">
                    {themes.map((theme) => {
                        const isActive = theme.id === active.id
                        const c = theme.colors

                        return (
                            <button
                                key={theme.id}
                                type="button"
                                onClick={() => setThemeId(theme.id)}
                                className={cn(
                                    'flex flex-col gap-2 rounded-xl p-3 text-left transition-colors',
                                    isActive
                                        ? 'ring-2 ring-(--accent-color)'
                                        : 'ring-1 ring-border hover:bg-muted/50',
                                )}
                                style={
                                    {
                                        '--accent-color': c.accent,
                                    } as ComponentProps<'button'>['style']
                                }
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex size-8 overflow-hidden rounded-lg"
                                            style={{
                                                borderWidth: 1,
                                                borderColor: c.border,
                                            }}
                                        >
                                            <div
                                                className="flex-1"
                                                style={{ backgroundColor: c.surfaceSecondary }}
                                            />
                                            <div
                                                className="flex-1"
                                                style={{ backgroundColor: c.accent }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium">{theme.name}</span>
                                    </div>
                                    {isActive && (
                                        <Check className="size-5" style={{ color: c.accent }} />
                                    )}
                                </div>
                                <div className="flex gap-1.5">
                                    {[
                                        c.surfaceSecondary,
                                        c.surfaceTertiary,
                                        c.accent,
                                        c.label,
                                        c.labelSecondary,
                                    ].map((color, i) => (
                                        <span
                                            key={i}
                                            className="size-4 rounded-full"
                                            style={{
                                                backgroundColor: color,
                                                border: `0.5px solid ${c.border}`,
                                            }}
                                        />
                                    ))}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </SheetContent>
        </Sheet>
    )
}
