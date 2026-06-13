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

export interface ExerciseData {
    id: string
    name: string
    sets: number
    reps: number
    expectedRpe: number | null
    loadRange: string | null
    loadActual: number | null
    rpeActual: number | null
    order: number
}

export interface DayData {
    id: string
    dayNumber: number
    exercises: ExerciseData[]
}

export interface WeekData {
    id: string
    weekNumber: number
    fatigueIndex: unknown | null
    weeklyCheckIn: unknown | null
    userNotesForCoach: string | null
    coachNotesForUser: string | null
    days: DayData[]
}

export interface BlockData {
    id: string
    name: string
    order: number
    weeks: WeekData[]
}

export interface Program {
    id: string
    name: string
    description: string | null
    userId: string
    createdAt: string
    updatedAt: string
    blocks: BlockData[]
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

async function apiPost(path: string, body: unknown) {
    const token = getToken()

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

async function apiPatch(path: string, body: unknown) {
    const token = getToken()

    const res = await fetch(`${API_URL}${path}`, {
        method: 'PATCH',
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

export async function getUsers() {
    return (await apiGet('/api/users')) as User[]
}

export async function getPrograms(userId?: string) {
    const path = userId ? `/api/programs?userId=${encodeURIComponent(userId)}` : '/api/programs'
    return (await apiGet(path)) as Program[]
}

export async function getProgram(programId: string) {
    return (await apiGet(`/api/programs/${programId}`)) as Program
}

export async function createProgram(body: {
    userId: string
    name: string
    description: string | null
    blocks: {
        name: string
        order: number
        weeks: {
            weekNumber: number
            coachNotesForUser: string | null
            userNotesForCoach: string | null
            fatigueIndex: Record<string, number> | null
            days: {
                dayNumber: number
                exercises: {
                    name: string
                    sets: number
                    reps: number
                    expectedRpe: number | null
                    loadRange: string | null
                    order: number
                }[]
            }[]
        }[]
    }[]
}) {
    return (await apiPost('/api/programs', body)) as Program
}

export async function updateProgram(
    programId: string,
    body: {
        name: string
        description: string | null
        blocks: {
            id?: string
            name: string
            order: number
            weeks: {
                id?: string
                weekNumber: number
                coachNotesForUser: string | null
                userNotesForCoach: string | null
                fatigueIndex: Record<string, number> | null
                days: {
                    id?: string
                    dayNumber: number
                    exercises: {
                        id?: string
                        name: string
                        sets: number
                        reps: number
                        expectedRpe: number | null
                        loadRange: string | null
                        order: number
                    }[]
                }[]
            }[]
        }[]
    },
) {
    return (await apiPatch(`/api/programs/${programId}`, body)) as Program
}

async function apiDelete(path: string) {
    const token = getToken()

    const res = await fetch(`${API_URL}${path}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    })

    const data = await res.json()

    if (!res.ok) throw new ApiError(res.status, data)

    return data
}

export async function getExerciseNames() {
    return (await apiGet('/api/exercises')) as string[]
}

export async function deleteProgram(programId: string) {
    return (await apiDelete(`/api/programs/${programId}`)) as { message: string }
}
