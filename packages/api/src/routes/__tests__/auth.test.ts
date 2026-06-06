import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

vi.mock('../../lib/prisma', () => ({
    prisma: {
        user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    },
}))

vi.mock('@prisma/adapter-pg', () => ({ PrismaPg: vi.fn() }))

vi.mock('bcryptjs', () => ({
    default: { hash: vi.fn(() => 'hashed-password'), compare: vi.fn() },
    hash: vi.fn(() => 'hashed-password'),
    compare: vi.fn(),
}))

process.env.JWT_SECRET = 'test-secret'

import { createApp } from '../../app'

const app = createApp()

afterEach(() => {
    vi.clearAllMocks()
})

const user = (overrides: Record<string, unknown> = {}) => ({
    id: 'user-1',
    email: 'alice@test.com',
    username: 'alice',
    password: 'hashed-password',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
})

describe('POST /api/auth/signup', () => {
    let prisma: any

    beforeAll(async () => {
        prisma = (await import('../../lib/prisma')).prisma
    })

    it('creates a user and returns a token', async () => {
        prisma.user.findFirst.mockResolvedValue(null)
        prisma.user.create.mockResolvedValue(user())

        const res = await request(app)
            .post('/api/auth/signup')
            .send({ email: 'alice@test.com', password: 'secret123', username: 'alice' })

        expect(res.status).toBe(201)
        expect(res.body.token).toBeDefined()
        expect(res.body.user).toEqual({ id: 'user-1', email: 'alice@test.com', username: 'alice' })
        expect(prisma.user.create).toHaveBeenCalledOnce()
    })

    it('rejects a duplicate email', async () => {
        prisma.user.findFirst.mockResolvedValue(
            user({ id: 'existing', email: 'alice@test.com', username: 'taken' }),
        )

        const res = await request(app)
            .post('/api/auth/signup')
            .send({ email: 'alice@test.com', password: 'secret123', username: 'bob' })

        expect(res.status).toBe(409)
        expect(res.body.error).toBe('email or username already exists')
    })

    it('rejects a duplicate username', async () => {
        prisma.user.findFirst.mockResolvedValue(
            user({ id: 'existing', email: 'other@test.com', username: 'alice' }),
        )

        const res = await request(app)
            .post('/api/auth/signup')
            .send({ email: 'bob@test.com', password: 'secret123', username: 'alice' })

        expect(res.status).toBe(409)
        expect(res.body.error).toBe('email or username already exists')
    })

    it('rejects missing fields', async () => {
        const res = await request(app).post('/api/auth/signup').send({ email: 'alice@test.com' })

        expect(res.status).toBe(400)
        expect(res.body.error).toBeDefined()
    })

    it('rejects a short password', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send({ email: 'alice@test.com', password: '12', username: 'alice' })

        expect(res.status).toBe(400)
        expect(res.body.error).toHaveProperty('password')
    })
})

describe('POST /api/auth/signin', () => {
    let prisma: any
    let bcryptCompare: any

    beforeAll(async () => {
        prisma = (await import('../../lib/prisma')).prisma
        bcryptCompare = (await import('bcryptjs')).default.compare
    })

    it('returns a token for valid credentials', async () => {
        prisma.user.findFirst.mockResolvedValue(user())
        bcryptCompare.mockResolvedValue(true)

        const res = await request(app)
            .post('/api/auth/signin')
            .send({ email: 'alice@test.com', password: 'secret123' })

        expect(res.status).toBe(200)
        expect(res.body.token).toBeDefined()
        expect(res.body.user).toEqual({ id: 'user-1', email: 'alice@test.com', username: 'alice' })
    })

    it('rejects wrong password', async () => {
        prisma.user.findFirst.mockResolvedValue(user())
        bcryptCompare.mockResolvedValue(false)

        const res = await request(app)
            .post('/api/auth/signin')
            .send({ email: 'alice@test.com', password: 'wrong' })

        expect(res.status).toBe(401)
        expect(res.body.error).toBe('invalid email or password')
    })

    it('rejects unknown email', async () => {
        prisma.user.findFirst.mockResolvedValue(null)

        const res = await request(app)
            .post('/api/auth/signin')
            .send({ email: 'nobody@test.com', password: 'secret123' })

        expect(res.status).toBe(401)
        expect(res.body.error).toBe('invalid email or password')
    })
})

describe('POST /api/auth/change-password', () => {
    let prisma: any
    let bcryptCompare: any
    let token: string

    beforeAll(async () => {
        prisma = (await import('../../lib/prisma')).prisma
        bcryptCompare = (await import('bcryptjs')).default.compare
        token = jwt.sign({ sub: 'user-1' }, 'test-secret')
    })

    it('changes password and returns success', async () => {
        prisma.user.findUnique.mockResolvedValue(user())
        bcryptCompare.mockResolvedValue(true)
        prisma.user.update.mockResolvedValue(user())

        const res = await request(app)
            .post('/api/auth/change-password')
            .set('Authorization', `Bearer ${token}`)
            .send({ currentPassword: 'old', newPassword: 'newpass123' })

        expect(res.status).toBe(200)
        expect(res.body.message).toBe('password changed')
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            data: { password: 'hashed-password' },
        })
    })

    it('rejects missing authorization header', async () => {
        const res = await request(app)
            .post('/api/auth/change-password')
            .send({ currentPassword: 'old', newPassword: 'newpass123' })

        expect(res.status).toBe(401)
        expect(res.body.error).toBe('missing authorization header')
    })

    it('rejects invalid token', async () => {
        const res = await request(app)
            .post('/api/auth/change-password')
            .set('Authorization', 'Bearer bad-token')
            .send({ currentPassword: 'old', newPassword: 'newpass123' })

        expect(res.status).toBe(401)
        expect(res.body.error).toBe('invalid token')
    })

    it('rejects wrong current password', async () => {
        prisma.user.findUnique.mockResolvedValue(user())
        bcryptCompare.mockResolvedValue(false)

        const res = await request(app)
            .post('/api/auth/change-password')
            .set('Authorization', `Bearer ${token}`)
            .send({ currentPassword: 'wrong', newPassword: 'newpass123' })

        expect(res.status).toBe(401)
        expect(res.body.error).toBe('current password is incorrect')
    })

    it('rejects short new password', async () => {
        const res = await request(app)
            .post('/api/auth/change-password')
            .set('Authorization', `Bearer ${token}`)
            .send({ currentPassword: 'old', newPassword: '12' })

        expect(res.status).toBe(400)
        expect(res.body.error).toHaveProperty('newPassword')
    })

    it('rejects missing fields', async () => {
        const res = await request(app)
            .post('/api/auth/change-password')
            .set('Authorization', `Bearer ${token}`)
            .send({ currentPassword: 'old' })

        expect(res.status).toBe(400)
        expect(res.body.error).toBeDefined()
    })

    it('returns 404 for unknown user', async () => {
        prisma.user.findUnique.mockResolvedValue(null)

        const res = await request(app)
            .post('/api/auth/change-password')
            .set('Authorization', `Bearer ${token}`)
            .send({ currentPassword: 'old', newPassword: 'newpass123' })

        expect(res.status).toBe(404)
        expect(res.body.error).toBe('user not found')
    })
})
