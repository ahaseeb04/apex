const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '')

export interface AuthUser {
    id: string
    email: string
    username: string
    role: string
}

export class ApiError extends Error {
    status: number
    body: unknown

    constructor(status: number, body: unknown) {
        super(`API error ${status}`)
        this.status = status
        this.body = body
    }

    getErrorMessage(): string {
        if (typeof this.body !== 'object' || this.body === null) return 'Something went wrong'
        const err = (this.body as Record<string, unknown>).error
        if (typeof err === 'string') return err
        if (typeof err === 'object' && err !== null) {
            return Object.entries(err)
                .flatMap(([, messages]) =>
                    Array.isArray(messages) ? messages.map(String) : [String(messages)],
                )
                .join('\n')
        }
        return 'Something went wrong'
    }
}

async function apiPost(path: string, body: Record<string, unknown>, token?: string) {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) throw new ApiError(res.status, data)

    return data
}

export async function signIn(email: string, password: string) {
    const data = (await apiPost('/api/auth/signin', { email, password, role: 'coach' })) as {
        token: string
        user: AuthUser
    }

    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('auth_user', JSON.stringify(data.user))

    return data
}

export function signOut() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
}

export function getStoredAuth() {
    if (typeof window === 'undefined') return null

    const token = localStorage.getItem('auth_token')
    const userJson = localStorage.getItem('auth_user')

    if (!token || !userJson) return null

    return { token, user: JSON.parse(userJson) as AuthUser }
}
