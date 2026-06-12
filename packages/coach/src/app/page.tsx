'use client'

import { useEffect, useState, useTransition, type FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
        )
    }

    if (user) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-6">
                <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Signed in</p>
                    <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Button variant="destructive" size="lg" onClick={signOut}>
                    Sign Out
                </Button>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
            <Card className="w-full max-w-sm">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl">Sign in</CardTitle>
                    <CardDescription>to continue to Conspiracy Barbell</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                autoCapitalize="none"
                                autoComplete="email"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                            />
                        </div>
                        {error ? (
                            <p className="text-xs text-destructive text-center">{error}</p>
                        ) : null}
                        <Button type="submit" disabled={loading} className="w-full" size="lg">
                            {loading ? (
                                <div className="size-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                            ) : (
                                'Continue'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
