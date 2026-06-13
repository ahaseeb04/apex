'use client'

import { useEffect, useState, useTransition } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { AppHeader } from '@/components/app-header'
import { getStoredAuth, signOut } from '@/lib/auth'
import { getPrograms } from '@/lib/api'
import type { AuthUser } from '@/lib/auth'
import type { Program } from '@/lib/api'
import { PlusIcon, LayersIcon } from 'lucide-react'

export default function UserProgramsPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()

    const userId = params.userId as string
    const username = searchParams.get('name') ?? 'User'

    const [user, setUser] = useState<AuthUser | null>(null)
    const [checking, setChecking] = useState(true)
    const [, startTransition] = useTransition()

    const [programs, setPrograms] = useState<Program[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        startTransition(() => {
            const stored = getStoredAuth()
            if (stored?.user) setUser(stored.user)
            setChecking(false)
        })
    }, [startTransition])

    useEffect(() => {
        if (!user) return
        let cancelled = false
        async function load() {
            setLoading(true)
            try {
                const data = await getPrograms(userId)
                if (!cancelled) setPrograms(data)
            } catch {
                if (!cancelled) setPrograms([])
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [user, userId])

    function handleSignOut() {
        signOut()
        router.push('/')
    }

    if (checking) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Spinner className="size-5 text-muted-foreground" />
            </div>
        )
    }

    if (!user) {
        router.push('/')
        return null
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <AppHeader
                title={`${username}'s Programs`}
                onSignOut={handleSignOut}
                backHref="/"
                hideEmailOnMobile
            />

            <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-6">
                <div className="mb-6 flex justify-end">
                    <Button className="w-full sm:w-auto" size="sm">
                        <PlusIcon className="size-4" />
                        New Program
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Spinner className="size-5 text-muted-foreground" />
                    </div>
                ) : programs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <LayersIcon className="size-10 text-muted-foreground/40 mb-4" />
                        <p className="text-base font-medium text-foreground">No programs yet</p>
                        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                            {`${username} `} doesn't have any training programs. Create one to get
                            started.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {programs.map((program) => (
                            <Card key={program.id} size="default">
                                <CardHeader>
                                    <div className="flex items-center justify-between gap-2">
                                        <CardTitle className="truncate font-bold">
                                            {program.name}
                                        </CardTitle>
                                        <Badge variant="secondary" className="shrink-0">
                                            {program.blocks.length}{' '}
                                            {program.blocks.length === 1 ? 'block' : 'blocks'}
                                        </Badge>
                                    </div>
                                    {program.description ? (
                                        <CardDescription className="line-clamp-2">
                                            {program.description}
                                        </CardDescription>
                                    ) : null}
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                        <span>
                                            {program.blocks.reduce(
                                                (total, block) => total + block.weeks.length,
                                                0,
                                            )}{' '}
                                            weeks
                                        </span>
                                        <span>
                                            Created{' '}
                                            {new Date(program.createdAt).toLocaleDateString(
                                                'en-US',
                                                {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                },
                                            )}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
