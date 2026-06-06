import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

vi.mock('../../lib/prisma', () => ({
    prisma: { user: { findFirst: vi.fn(), create: vi.fn() }, week: { findUnique: vi.fn(), update: vi.fn() } },
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

const week = (overrides: Record<string, unknown> = {}) => ({
    id: 'week-1',
    blockId: 'block-1',
    weekNumber: 1,
    fatigueIndex: null,
    weeklyCheckIn: null,
    userNotesForCoach: null,
    coachNotesForUser: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
})

const updatedWeek = (overrides: Record<string, unknown> = {}) => ({
    ...week(),
    days: [],
    ...overrides,
})

describe('PATCH /api/weeks/:id', () => {
    let prisma: any

    beforeAll(async () => {
        prisma = (await import('../../lib/prisma')).prisma
    })

    it('updates userNotesForCoach', async () => {
        prisma.week.findUnique.mockResolvedValue({ userId: 'user-1' })
        prisma.week.update.mockResolvedValue(updatedWeek({ userNotesForCoach: 'Feeling tired this week' }))

        const res = await request(app)
            .patch('/api/weeks/week-1')
            .set('Authorization', 'Bearer valid-token')
            .send({ userNotesForCoach: 'Feeling tired this week' })

        expect(res.status).toBe(200)
        expect(res.body.userNotesForCoach).toBe('Feeling tired this week')
        expect(prisma.week.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'week-1' },
                data: { userNotesForCoach: 'Feeling tired this week' },
            }),
        )
    })

    it('updates fatigueIndex', async () => {
        const fatigueIndex = {
            sleep_quality: 3,
            cognitive_capacity: 4,
            general_motivation: 3,
            motivation_to_train: 4,
            sense_of_wellbeing: 3,
            perceived_stress: 2,
            energy_levels: 3,
            libido: 3,
            soreness: 3,
        }

        prisma.week.findUnique.mockResolvedValue({ userId: 'user-1' })
        prisma.week.update.mockResolvedValue(updatedWeek({ fatigueIndex }))

        const res = await request(app)
            .patch('/api/weeks/week-1')
            .set('Authorization', 'Bearer valid-token')
            .send({ fatigueIndex })

        expect(res.status).toBe(200)
        expect(res.body.fatigueIndex).toEqual(fatigueIndex)
    })

    it('updates weeklyCheckIn', async () => {
        const weeklyCheckIn = { bodyweight: 82.5, calories: 2800, sleep_hours: 7.5 }

        prisma.week.findUnique.mockResolvedValue({ userId: 'user-1' })
        prisma.week.update.mockResolvedValue(updatedWeek({ weeklyCheckIn }))

        const res = await request(app)
            .patch('/api/weeks/week-1')
            .set('Authorization', 'Bearer valid-token')
            .send({ weeklyCheckIn })

        expect(res.status).toBe(200)
        expect(res.body.weeklyCheckIn).toEqual(weeklyCheckIn)
    })

    it('updates all fields at once', async () => {
        const fatigueIndex = {
            sleep_quality: 3,
            cognitive_capacity: 4,
            general_motivation: 3,
            motivation_to_train: 4,
            sense_of_wellbeing: 3,
            perceived_stress: 2,
            energy_levels: 3,
            libido: 3,
            soreness: 3,
        }
        const weeklyCheckIn = { bodyweight: 82.5, calories: 2800, sleep_hours: 7.5 }
        const userNotesForCoach = 'Great week'

        prisma.week.findUnique.mockResolvedValue({ userId: 'user-1' })
        prisma.week.update.mockResolvedValue(
            updatedWeek({ fatigueIndex, weeklyCheckIn, userNotesForCoach }),
        )

        const res = await request(app)
            .patch('/api/weeks/week-1')
            .set('Authorization', 'Bearer valid-token')
            .send({ fatigueIndex, weeklyCheckIn, userNotesForCoach })

        expect(res.status).toBe(200)
        expect(res.body.fatigueIndex).toEqual(fatigueIndex)
        expect(res.body.weeklyCheckIn).toEqual(weeklyCheckIn)
        expect(res.body.userNotesForCoach).toBe(userNotesForCoach)
    })

    it('sets userNotesForCoach to null', async () => {
        prisma.week.findUnique.mockResolvedValue({ userId: 'user-1' })
        prisma.week.update.mockResolvedValue(updatedWeek({ userNotesForCoach: null }))

        const res = await request(app)
            .patch('/api/weeks/week-1')
            .set('Authorization', 'Bearer valid-token')
            .send({ userNotesForCoach: null })

        expect(res.status).toBe(200)
        expect(res.body.userNotesForCoach).toBeNull()
    })

    it('returns 400 for invalid field values in fatigueIndex', async () => {
        const res = await request(app)
            .patch('/api/weeks/week-1')
            .set('Authorization', 'Bearer valid-token')
            .send({ fatigueIndex: { sleep_quality: 10 } })

        expect(res.status).toBe(400)
        expect(res.body.error).toBeDefined()
    })

    it('returns 400 for invalid field values in weeklyCheckIn', async () => {
        const res = await request(app)
            .patch('/api/weeks/week-1')
            .set('Authorization', 'Bearer valid-token')
            .send({ weeklyCheckIn: { bodyweight: 'heavy' } })

        expect(res.status).toBe(400)
        expect(res.body.error).toBeDefined()
    })

    it('returns 404 when week does not exist', async () => {
        prisma.week.findUnique.mockResolvedValue(null)

        const res = await request(app)
            .patch('/api/weeks/week-1')
            .set('Authorization', 'Bearer valid-token')
            .send({ userNotesForCoach: 'test' })

        expect(res.status).toBe(404)
        expect(res.body.error).toBe('week not found')
    })

    it('returns 404 when week belongs to a different user', async () => {
        prisma.week.findUnique.mockResolvedValue({ userId: 'other-user' })

        const res = await request(app)
            .patch('/api/weeks/week-1')
            .set('Authorization', 'Bearer valid-token')
            .send({ userNotesForCoach: 'test' })

        expect(res.status).toBe(404)
        expect(res.body.error).toBe('week not found')
    })

    it('returns 401 when authorization header is missing', async () => {
        const res = await request(app)
            .patch('/api/weeks/week-1')
            .send({ userNotesForCoach: 'test' })

        expect(res.status).toBe(401)
        expect(res.body.error).toBe('missing authorization header')
    })
})
