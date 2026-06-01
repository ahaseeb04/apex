export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000'

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

    return data as { token: string; user: { id: string; email: string; username: string } }
}
