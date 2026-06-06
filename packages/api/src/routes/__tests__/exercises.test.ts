import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

vi.mock('../../lib/prisma', () => ({
    prisma: {
        user: { findFirst: vi.fn(), create: vi.fn() },
        exercise: { findUnique: vi.fn(), update: vi.fn() },
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

const exercise = (overrides: Record<string, unknown> = {}) => ({
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
    ...overrides,
})

describe('PATCH /api/exercises/:id', () => {
    let prisma: any

    beforeAll(async () => {
        prisma = (await import('../../lib/prisma')).prisma
    })

    it('updates loadActual', async () => {
        prisma.exercise.findUnique.mockResolvedValue({ userId: 'user-1' })
        prisma.exercise.update.mockResolvedValue(exercise({ loadActual: 100 }))

        const res = await request(app)
            .patch('/api/exercises/exercise-1')
            .set('Authorization', 'Bearer valid-token')
            .send({ loadActual: 100 })

        expect(res.status).toBe(200)
        expect(res.body.loadActual).toBe(100)
        expect(prisma.exercise.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'exercise-1' },
                data: { loadActual: 100 },
            }),
        )
    })

    it('updates rpeActual', async () => {
        prisma.exercise.findUnique.mockResolvedValue({ userId: 'user-1' })
        prisma.exercise.update.mockResolvedValue(exercise({ rpeActual: 8 }))

        const res = await request(app)
            .patch('/api/exercises/exercise-1')
            .set('Authorization', 'Bearer valid-token')
            .send({ rpeActual: 8 })

        expect(res.status).toBe(200)
        expect(res.body.rpeActual).toBe(8)
    })

    it('updates both loadActual and rpeActual', async () => {
        prisma.exercise.findUnique.mockResolvedValue({ userId: 'user-1' })
        prisma.exercise.update.mockResolvedValue(exercise({ loadActual: 120, rpeActual: 8.5 }))

        const res = await request(app)
            .patch('/api/exercises/exercise-1')
            .set('Authorization', 'Bearer valid-token')
            .send({ loadActual: 120, rpeActual: 8.5 })

        expect(res.status).toBe(200)
        expect(res.body.loadActual).toBe(120)
        expect(res.body.rpeActual).toBe(8.5)
    })

    it('sets loadActual to null', async () => {
        prisma.exercise.findUnique.mockResolvedValue({ userId: 'user-1' })
        prisma.exercise.update.mockResolvedValue(exercise({ loadActual: null }))

        const res = await request(app)
            .patch('/api/exercises/exercise-1')
            .set('Authorization', 'Bearer valid-token')
            .send({ loadActual: null })

        expect(res.status).toBe(200)
        expect(res.body.loadActual).toBeNull()
    })

    it('sets rpeActual to null', async () => {
        prisma.exercise.findUnique.mockResolvedValue({ userId: 'user-1' })
        prisma.exercise.update.mockResolvedValue(exercise({ rpeActual: null }))

        const res = await request(app)
            .patch('/api/exercises/exercise-1')
            .set('Authorization', 'Bearer valid-token')
            .send({ rpeActual: null })

        expect(res.status).toBe(200)
        expect(res.body.rpeActual).toBeNull()
    })

    it('returns 400 for invalid loadActual type', async () => {
        const res = await request(app)
            .patch('/api/exercises/exercise-1')
            .set('Authorization', 'Bearer valid-token')
            .send({ loadActual: 'heavy' })

        expect(res.status).toBe(400)
        expect(res.body.error).toBeDefined()
    })

    it('returns 400 for invalid rpeActual type', async () => {
        const res = await request(app)
            .patch('/api/exercises/exercise-1')
            .set('Authorization', 'Bearer valid-token')
            .send({ rpeActual: 'eight' })

        expect(res.status).toBe(400)
        expect(res.body.error).toBeDefined()
    })

    it('returns 404 when exercise does not exist', async () => {
        prisma.exercise.findUnique.mockResolvedValue(null)

        const res = await request(app)
            .patch('/api/exercises/exercise-1')
            .set('Authorization', 'Bearer valid-token')
            .send({ loadActual: 100 })

        expect(res.status).toBe(404)
        expect(res.body.error).toBe('exercise not found')
    })

    it('returns 404 when exercise belongs to a different user', async () => {
        prisma.exercise.findUnique.mockResolvedValue({ userId: 'other-user' })

        const res = await request(app)
            .patch('/api/exercises/exercise-1')
            .set('Authorization', 'Bearer valid-token')
            .send({ loadActual: 100 })

        expect(res.status).toBe(404)
        expect(res.body.error).toBe('exercise not found')
    })

    it('returns 401 when authorization header is missing', async () => {
        const res = await request(app)
            .patch('/api/exercises/exercise-1')
            .send({ loadActual: 100 })

        expect(res.status).toBe(401)
        expect(res.body.error).toBe('missing authorization header')
    })
})
