'use client'

import { useEffect, useState, useTransition, type FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { signIn, ApiError, getStoredAuth, signOut } from '@/lib/auth'
import type { AuthUser } from '@/lib/auth'

export default function Home() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
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

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setError('')

        if (!email.trim() || !password.trim()) {
            setError('Please fill in all fields')
            return
        }

        setLoading(true)
        try {
            const result = await signIn(email.trim(), password)
            setUser(result.user)
        } catch (e) {
            if (e instanceof ApiError) {
                setError(e.getErrorMessage())
            } else {
                setError('Unable to connect to server')
            }
        } finally {
            setLoading(false)
        }
    }

    if (checking) {
        return (
            <div
                className="flex min-h-screen items-center justify-center"
                style={{ backgroundColor: '#000000' }}
            >
                <div className="size-5 animate-spin rounded-full border-2 border-[#8E8E93] border-t-transparent" />
            </div>
        )
    }

    if (user) {
        return (
            <>
                <div
                    className="flex flex-col min-h-screen items-center justify-center p-6"
                    style={{ backgroundColor: '#000000' }}
                >
                    <div className="text-center">
                        <p className="text-sm font-medium text-white">Signed in</p>
                        <p className="mt-1 text-xs text-[#8E8E93]">{user.email}</p>
                    </div>

                    <Button variant="destructive" size="lg" onClick={signOut}>
                        Sign Out
                    </Button>
                </div>
            </>
        )
    }

    return (
        <div className="flex min-h-screen p-6" style={{ backgroundColor: '#000000' }}>
            <div className="mx-auto flex w-full max-w-md flex-col justify-center">
                <h1 className="text-[32px] font-bold tracking-tight text-white">Sign in</h1>
                <p className="mb-10 mt-1.5 text-[16px] text-[#8E8E93]">
                    to continue to Conspiracy Barbell
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: 16 }}>
                    <div>
                        <Label
                            className="mb-2 ml-1 block text-[13px] font-medium tracking-wide text-[#8E8E93]"
                            htmlFor="email"
                        >
                            Email address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoCapitalize="none"
                            autoComplete="email"
                            className="h-auto rounded-[12px] border-[#38383A] px-4 py-[14px] text-[17px] leading-[22px] text-white placeholder:text-[#636366] focus-visible:border-[#0A84FF] focus-visible:ring-0 dark:bg-transparent"
                        />
                    </div>

                    <div>
                        <Label
                            className="mb-2 ml-1 block text-[13px] font-medium tracking-wide text-[#8E8E93]"
                            htmlFor="password"
                        >
                            Password
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            className="h-auto rounded-[12px] border-[#38383A] px-4 py-[14px] text-[17px] leading-[22px] text-white placeholder:text-[#636366] focus-visible:border-[#0A84FF] focus-visible:ring-0 dark:bg-transparent"
                        />
                    </div>

                    {error ? (
                        <p className="mt-1 text-center text-[14px] text-[#FF3B30]">{error}</p>
                    ) : null}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="mt-4 h-auto w-full rounded-[12px] py-[16px] text-[16px] font-semibold text-white hover:opacity-90 focus-visible:ring-0 active:translate-y-0 disabled:opacity-50"
                        style={{ backgroundColor: '#0A84FF' }}
                    >
                        {loading ? (
                            <div className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                            'Continue'
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
