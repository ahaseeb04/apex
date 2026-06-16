'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Input } from '@/components/ui/input'
import { getExerciseNames } from '@/lib/api'

const EXERCISE_NAMES_CACHE_KEY = 'exercise_names'
const CACHE_TTL = 3 * 60 * 60 * 1000

interface ExerciseNamesCache {
    names: string[]
    lastFetched: number
}

function loadCachedExerciseNames(): string[] | null {
    try {
        const raw = localStorage.getItem(EXERCISE_NAMES_CACHE_KEY)
        if (!raw) return null
        const cached: ExerciseNamesCache = JSON.parse(raw)
        if (Date.now() - cached.lastFetched < CACHE_TTL) {
            return cached.names
        }
    } catch {
        // invalid cache
    }
    return null
}

function saveExerciseNamesToCache(names: string[]) {
    try {
        const data: ExerciseNamesCache = { names, lastFetched: Date.now() }
        localStorage.setItem(EXERCISE_NAMES_CACHE_KEY, JSON.stringify(data))
    } catch {
        // storage unavailable
    }
}

export function useExerciseNames() {
    const [names, setNames] = useState<string[]>(() => loadCachedExerciseNames() ?? [])

    useEffect(() => {
        const cached = loadCachedExerciseNames()
        if (cached) {
            setNames(cached)
            return
        }

        getExerciseNames()
            .then((fetched) => {
                setNames(fetched)
                saveExerciseNamesToCache(fetched)
            })
            .catch(() => {
                if (!cached) setNames([])
            })
    }, [])

    return names
}

export function ExerciseNameInput({
    value,
    onChange,
    suggestions,
    placeholder = 'Exercise name',
    className = 'h-8 border-0 px-1 text-sm shadow-none focus-visible:ring-0 bg-transparent!',
}: {
    value: string
    onChange: (value: string) => void
    suggestions: string[]
    placeholder?: string
    className?: string
}) {
    const [open, setOpen] = useState(false)
    const [rect, setRect] = useState<DOMRect | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const openRef = useRef(open)
    openRef.current = open

    const filtered = value.trim()
        ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase())).slice(0, 10)
        : []

    const showDropdown = open && filtered.length > 0

    const syncRect = useCallback(() => {
        if (inputRef.current) {
            setRect(inputRef.current.getBoundingClientRect())
        }
    }, [])

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => {
        function onScroll() {
            if (openRef.current) syncRect()
        }
        document.addEventListener('scroll', onScroll, { capture: true })
        window.addEventListener('resize', onScroll)
        return () => {
            document.removeEventListener('scroll', onScroll, { capture: true })
            window.removeEventListener('resize', onScroll)
        }
    }, [syncRect])

    const handleFocus = useCallback(() => {
        syncRect()
        setOpen(true)
    }, [syncRect])

    return (
        <div ref={containerRef}>
            <Input
                ref={inputRef}
                value={value}
                autoComplete="off"
                onChange={(e) => onChange(e.target.value)}
                onFocus={handleFocus}
                placeholder={placeholder}
                className={className}
            />
            {showDropdown &&
                rect &&
                createPortal(
                    <div
                        className="fixed z-50 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
                        style={{
                            top: rect.bottom + 4,
                            left: rect.left,
                            width: rect.width,
                        }}
                    >
                        <div className="max-h-48 overflow-y-auto p-1">
                            {filtered.map((name) => (
                                <button
                                    key={name}
                                    type="button"
                                    className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        onChange(name)
                                        setOpen(false)
                                    }}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>,
                    document.body,
                )}
        </div>
    )
}
