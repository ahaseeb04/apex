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

export interface Program {
    id: string
    name: string
    description: string | null
    userId: string
    createdAt: string
    updatedAt: string
    blocks: {
        id: string
        name: string
        order: number
        weeks: {
            id: string
            weekNumber: number
            days: unknown[]
        }[]
    }[]
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

export async function getPrograms(userId?: string) {
    const path = userId ? `/api/programs?userId=${encodeURIComponent(userId)}` : '/api/programs'
    return (await apiGet(path)) as Program[]
}
