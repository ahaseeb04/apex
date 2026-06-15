'use client'

import { useEffect, useState, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppHeader } from '@/components/app-header'
import { ProgramForm } from '@/components/program-form'
import { Spinner } from '@/components/ui/spinner'
import { getStoredAuth, signOut } from '@/lib/auth'
import { getProgram, type Program } from '@/lib/api'
import type { AuthUser } from '@/lib/auth'

export default function EditProgramPage() {
    const params = useParams()
    const router = useRouter()
    const userId = params.userId as string
    const programId = params.programId as string

    const [user, setUser] = useState<AuthUser | null>(null)
    const [checking, setChecking] = useState(true)
    const [, startTransition] = useTransition()

    const [program, setProgram] = useState<Program | null>(null)
    const [loading, setLoading] = useState(true)

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
                const data = await getProgram(programId)
                if (!cancelled) setProgram(data)
            } catch {
                if (!cancelled) router.push(`/users/${userId}/programs`)
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [user, userId, programId, router])

    function handleSignOut() {
        signOut()
        router.push('/')
    }

    if (checking || loading) {
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

    if (!program) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <p className="text-sm text-muted-foreground">Program not found</p>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <AppHeader
                title={`Edit "${program.name}"`}
                email={user.email}
                onSignOut={handleSignOut}
                backHref={`/users/${userId}/programs`}
                hideEmailOnMobile
            />
            <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-6">
                <ProgramForm userId={userId} program={program} />
            </main>
        </div>
    )
}
