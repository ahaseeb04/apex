'use client'

import { useEffect, useState, useTransition, type FormEvent } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Spinner } from '@/components/ui/spinner'
import { ThemeSheet } from '@/components/theme-sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VideoUploadForm } from '@/components/video-upload-form'
import { signIn, ApiError, getStoredAuth, signOut } from '@/lib/auth'
import { getUsers } from '@/lib/api'
import type { AuthUser } from '@/lib/auth'
import type { User } from '@/lib/api'

export default function Home() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [user, setUser] = useState<AuthUser | null>(null)
    const [checking, setChecking] = useState(true)
    const [, startTransition] = useTransition()

    const [users, setUsers] = useState<User[]>([])
    const [usersLoading, setUsersLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('tab') || 'users'
        }
        return 'users'
    })

    function handleTabChange(tab: string) {
        setActiveTab(tab)
        localStorage.setItem('tab', tab)
    }

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
            setUsersLoading(true)
            try {
                const data = await getUsers()
                if (!cancelled) setUsers(data)
            } catch {
                if (!cancelled) setUsers([])
            } finally {
                if (!cancelled) setUsersLoading(false)
            }
        }
        load()
        return () => {
            cancelled = true
        }
    }, [user])

    const filteredUsers = users.filter((u) => {
        const q = search.toLowerCase()

        return (
            u.username.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q)
        )
    })

    function handleSignOut() {
        signOut()
        setUser(null)
        setUsers([])
    }

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
                <Spinner className="size-5 text-muted-foreground" />
            </div>
        )
    }

    if (user) {
        return (
            <div className="flex min-h-screen flex-col bg-background">
                <header className="sticky top-0 z-10 border-b border-border bg-background">
                    <div className="mx-auto flex h-16 max-w-2xl items-center gap-4 px-6">
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1">
                            <TabsList variant="line">
                                <TabsTrigger
                                    value="users"
                                    className="text-base font-semibold tracking-tight"
                                >
                                    Users
                                </TabsTrigger>
                                <TabsTrigger
                                    value="videos"
                                    className="text-base font-semibold tracking-tight"
                                >
                                    Videos
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className="flex items-center justify-end gap-x-2">
                            <span className="text-sm text-muted-foreground">{user.email}</span>
                            <ThemeSheet />
                            <Button variant="outline" onClick={handleSignOut}>
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-6">
                    {activeTab === 'users' ? (
                        <>
                            <div className="mb-4">
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search users..."
                                    className="h-10 bg-transparent"
                                />
                            </div>

                            {usersLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Spinner className="size-5 text-muted-foreground" />
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <p className="py-12 text-center text-base text-muted-foreground">
                                    {search ? 'No users match your search' : 'No users found'}
                                </p>
                            ) : (
                                <div className="divide-y divide-border rounded-xl overflow-hidden border border-border">
                                    {filteredUsers.map((u) => (
                                        <Link
                                            key={u.id}
                                            href={`/users/${u.id}/programs?name=${encodeURIComponent(u.username)}`}
                                            className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50"
                                            onClick={() =>
                                                sessionStorage.setItem('name', u.username)
                                            }
                                        >
                                            <Avatar>
                                                <AvatarFallback>
                                                    {u.username.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-base font-medium">
                                                    {u.username}
                                                </p>
                                                <p className="truncate text-sm text-muted-foreground">
                                                    {u.email}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <VideoUploadForm />
                    )}
                </main>
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
                            {loading ? <Spinner /> : 'Continue'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
