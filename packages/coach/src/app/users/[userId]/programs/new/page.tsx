'use client'

import { useEffect, useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { ProgramForm } from '@/components/program-form'
import { Spinner } from '@/components/ui/spinner'
import { getStoredAuth, signOut } from '@/lib/auth'
import type { AuthUser } from '@/lib/auth'

export default function NewProgramPage() {
    const params = useParams()
    const router = useRouter()
    const userId = params.userId as string

    const [user, setUser] = useState<AuthUser | null>(null)
    const [checking, setChecking] = useState(true)
    const [, startTransition] = useTransition()

    useEffect(() => {
        startTransition(() => {
            const stored = getStoredAuth()
            if (stored?.user) setUser(stored.user)
            setChecking(false)
        })
    }, [startTransition])

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
                title="New Program"
                email={user.email}
                onSignOut={handleSignOut}
                backHref={`/users/${userId}/programs`}
            />
            <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-6">
                <ProgramForm userId={userId} />
            </main>
        </div>
    )
}
