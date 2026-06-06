import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

vi.mock('../../lib/prisma', () => ({
    prisma: {
        user: { findFirst: vi.fn(), create: vi.fn() },
        program: { findMany: vi.fn(), findFirst: vi.fn() },
    },
}))

vi.mock('@prisma/adapter-pg', () => ({ PrismaPg: vi.fn() }))

vi.mock('jsonwebtoken', () => ({
    default: { verify: vi.fn(() => ({ sub: 'user-1' })), sign: vi.fn() },
    verify: vi.fn(() => ({ sub: 'user-1' })),
    sign: vi.fn(),
}))

process.env.JWT_SECRET = 'test-secret'

import { createApp } from '../../app'

const app = createApp()

afterEach(() => {
    vi.clearAllMocks()
})

const PROGRAM_ID = '550e8400-e29b-41d4-a716-446655440000'

const program = (overrides: Record<string, unknown> = {}) => ({
    id: PROGRAM_ID,
    name: 'Starting Strength',
    description: 'Beginner linear progression',
    userId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    blocks: [
        {
            id: 'block-1',
            programId: PROGRAM_ID,
            name: 'Block 1',
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            weeks: [
                {
                    id: 'week-1',
                    blockId: 'block-1',
                    weekNumber: 1,
                    fatigueIndex: null,
                    weeklyCheckIn: null,
                    userNotesForCoach: null,
                    coachNotesForUser: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    days: [
                        {
                            id: 'day-1',
                            weekId: 'week-1',
                            dayNumber: 1,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            exercises: [
                                {
                                    id: 'exercise-1',
                                    dayId: 'day-1',
                                    name: 'Squat',
                                    sets: 3,
                                    reps: 5,
                                    expectedRpe: null,
                                    loadRange: null,
                                    loadActual: null,
                                    rpeActual: null,
                                    order: 1,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
    ...overrides,
})

describe('GET /api/programs', () => {
    let prisma: any

    beforeAll(async () => {
        prisma = (await import('../../lib/prisma')).prisma
    })

    it('returns programs for the authenticated user', async () => {
        prisma.program.findMany.mockResolvedValue([program()])

        const res = await request(app)
            .get('/api/programs')
            .set('Authorization', 'Bearer valid-token')

        expect(res.status).toBe(200)
        expect(res.body).toHaveLength(1)
        expect(res.body[0].id).toBe(PROGRAM_ID)
        expect(res.body[0].name).toBe('Starting Strength')
        expect(res.body[0].blocks).toBeDefined()
        expect(prisma.program.findMany).toHaveBeenCalledOnce()
    })

    it('returns an empty array when user has no programs', async () => {
        prisma.program.findMany.mockResolvedValue([])

        const res = await request(app)
            .get('/api/programs')
            .set('Authorization', 'Bearer valid-token')

        expect(res.status).toBe(200)
        expect(res.body).toEqual([])
    })

    it('returns 401 when authorization header is missing', async () => {
        const res = await request(app).get('/api/programs')

        expect(res.status).toBe(401)
        expect(res.body.error).toBe('missing authorization header')
    })

    it('returns 401 with an invalid token', async () => {
        const jwt = await import('jsonwebtoken')
        const jwtVerify = jwt.default.verify as ReturnType<typeof vi.fn>
        jwtVerify.mockImplementationOnce(() => {
            throw new Error('invalid')
        })

        const res = await request(app)
            .get('/api/programs')
            .set('Authorization', 'Bearer invalid-token')

        expect(res.status).toBe(401)
        expect(res.body.error).toBe('invalid token')
    })
})

describe('GET /api/programs/:id', () => {
    let prisma: any

    beforeAll(async () => {
        prisma = (await import('../../lib/prisma')).prisma
    })

    it('returns the program for the authenticated user', async () => {
        prisma.program.findFirst.mockResolvedValue(program())

        const res = await request(app)
            .get(`/api/programs/${PROGRAM_ID}`)
            .set('Authorization', 'Bearer valid-token')

        expect(res.status).toBe(200)
        expect(res.body.id).toBe(PROGRAM_ID)
        expect(res.body.name).toBe('Starting Strength')
        expect(res.body.blocks).toBeDefined()
        expect(prisma.program.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: PROGRAM_ID, userId: 'user-1' } }),
        )
    })

    it('returns 400 for an invalid uuid', async () => {
        const res = await request(app)
            .get('/api/programs/not-a-uuid')
            .set('Authorization', 'Bearer valid-token')

        expect(res.status).toBe(400)
        expect(res.body.error).toBe('invalid program id')
    })

    it('returns 404 when program does not exist', async () => {
        prisma.program.findFirst.mockResolvedValue(null)

        const res = await request(app)
            .get(`/api/programs/${PROGRAM_ID}`)
            .set('Authorization', 'Bearer valid-token')

        expect(res.status).toBe(404)
        expect(res.body.error).toBe('program not found')
    })

    it('returns 404 when program belongs to a different user', async () => {
        prisma.program.findFirst.mockResolvedValue(null)

        const res = await request(app)
            .get(`/api/programs/${PROGRAM_ID}`)
            .set('Authorization', 'Bearer valid-token')

        expect(res.status).toBe(404)
        expect(res.body.error).toBe('program not found')
    })

    it('returns 401 when authorization header is missing', async () => {
        const res = await request(app).get(`/api/programs/${PROGRAM_ID}`)

        expect(res.status).toBe(401)
        expect(res.body.error).toBe('missing authorization header')
    })
})
