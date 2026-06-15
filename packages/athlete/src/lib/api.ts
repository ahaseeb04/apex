export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000'

export function isEmailVerificationEnabled() {
    return process.env.EXPO_PUBLIC_EMAIL_VERIFICATION_ENABLED !== 'false'
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
    fatigueIndex: Record<string, number> | null
    weeklyCheckIn: Record<string, number> | null
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

export interface ProgramData {
    id: string
    name: string
    description: string | null
    blocks: BlockData[]
}

export interface ExerciseVideo {
    id: string
    exerciseName: string
    videoUrl: string
    thumbnailUrl: string | null
    createdAt: string
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

export async function apiPatch(path: string, body: Record<string, unknown>, token: string) {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
        throw new ApiError(res.status, data)
    }

    return data
}

export async function apiGet(path: string, token: string) {
    const res = await fetch(`${API_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
    })

    const data = await res.json()

    if (!res.ok) {
        throw new ApiError(res.status, data)
    }

    return data
}

export async function getVideos(token: string) {
    return (await apiGet('/api/videos', token)) as ExerciseVideo[]
}

export async function apiPost(path: string, body: Record<string, unknown>, token?: string) {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
        throw new ApiError(res.status, data)
    }

    return data
}
