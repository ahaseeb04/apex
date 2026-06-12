import { ApiError } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export interface User {
    id: string
    email: string
    username: string
    role: string
    emailVerified: boolean
    createdAt: string
}

function getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
}

async function apiGet(path: string) {
    const token = getToken()

    const res = await fetch(`${API_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    })

    const data = await res.json()

    if (!res.ok) throw new ApiError(res.status, data)

    return data
}

export async function getUsers() {
    return (await apiGet('/api/users')) as User[]
}
