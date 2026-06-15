import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'

vi.mock('../../lib/prisma', () => ({
    prisma: {
        user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
        exercise: { deleteMany: vi.fn() },
        day: { deleteMany: vi.fn() },
        week: { deleteMany: vi.fn() },
        block: { deleteMany: vi.fn() },
        program: { deleteMany: vi.fn() },
        $transaction: vi.fn((ops: any) => Promise.all(ops)),
    },
}))

vi.mock('@prisma/adapter-pg', () => ({ PrismaPg: vi.fn() }))

vi.mock('../../lib/email', () => ({
    sendVerificationEmail: vi.fn(),
}))

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

const USER_ID = '00000000-0000-0000-0000-000000000001'
const USER_ID_2 = '00000000-0000-0000-0000-000000000002'

const user = (overrides: Record<string, unknown> = {}) => ({
    id: USER_ID,
    email: 'alice@test.com',
    username: 'alice',
    role: 'athlete',
    password: 'hashed-password',
    emailVerified: true,
    emailVerificationCode: null,
    emailVerificationCodeExpiry: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
})

describe('POST /api/auth/signup', () => {
    let prisma: any
    let sendVerificationEmail: any

    beforeAll(async () => {
        prisma = (await import('../../lib/prisma')).prisma
        sendVerificationEmail = (await import('../../lib/email')).sendVerificationEmail
    })

    it('creates a user and sends verification email', async () => {
        prisma.user.findFirst.mockResolvedValue(null)
        prisma.user.create.mockResolvedValue(user({ emailVerified: false }))
        sendVerificationEmail.mockResolvedValue(undefined)

        const res = await request(app)
            .post('/api/auth/signup')
            .send({ email: 'alice@test.com', password: 'secret123', username: 'alice' })

        expect(res.status).toBe(201)
        expect(res.body.userId).toBe(USER_ID)
        expect(res.body.email).toBe('alice@test.com')
        expect(res.body.message).toBe('Verification code sent to your email')
        expect(res.body.token).toBeUndefined()
        expect(sendVerificationEmail).toHaveBeenCalledWith('alice@test.com', expect.any(String))
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
        expect(res.body.user).toEqual({ id: USER_ID, email: 'alice@test.com', username: 'alice', role: 'athlete' })
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

    it('rejects unverified email with 403 and userId', async () => {
        prisma.user.findFirst.mockResolvedValue(user({ emailVerified: false }))
        bcryptCompare.mockResolvedValue(true)

        const res = await request(app)
            .post('/api/auth/signin')
            .send({ email: 'alice@test.com', password: 'secret123' })

        expect(res.status).toBe(403)
        expect(res.body.error).toBe('email not verified')
        expect(res.body.userId).toBe(USER_ID)
        expect(res.body.email).toBe('alice@test.com')
    })
})

describe('POST /api/auth/verify-email', () => {
    let prisma: any

    beforeAll(async () => {
        prisma = (await import('../../lib/prisma')).prisma
    })

    it('verifies email and returns a token', async () => {
        const expiry = new Date(Date.now() + 10 * 60 * 1000)
        prisma.user.findUnique.mockResolvedValue(
            user({ emailVerified: false, emailVerificationCode: '123456', emailVerificationCodeExpiry: expiry }),
        )
        prisma.user.update.mockResolvedValue(user({ emailVerified: true }))

        const res = await request(app)
            .post('/api/auth/verify-email')
            .send({ userId: USER_ID, code: '123456' })

        expect(res.status).toBe(200)
        expect(res.body.token).toBeDefined()
        expect(res.body.user).toEqual({ id: USER_ID, email: 'alice@test.com', username: 'alice', role: 'athlete' })
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: USER_ID },
            data: { emailVerified: true, emailVerificationCode: null, emailVerificationCodeExpiry: null },
        })
    })

    it('rejects invalid code', async () => {
        const expiry = new Date(Date.now() + 10 * 60 * 1000)
        prisma.user.findUnique.mockResolvedValue(
            user({ emailVerified: false, emailVerificationCode: '123456', emailVerificationCodeExpiry: expiry }),
        )

        const res = await request(app)
            .post('/api/auth/verify-email')
            .send({ userId: USER_ID, code: '999999' })

        expect(res.status).toBe(400)
        expect(res.body.error).toBe('invalid verification code')
    })

    it('rejects expired code', async () => {
        const expiry = new Date(Date.now() - 1)
        prisma.user.findUnique.mockResolvedValue(
            user({ emailVerified: false, emailVerificationCode: '123456', emailVerificationCodeExpiry: expiry }),
        )

        const res = await request(app)
            .post('/api/auth/verify-email')
            .send({ userId: USER_ID, code: '123456' })

        expect(res.status).toBe(400)
        expect(res.body.error).toBe('verification code has expired. Please request a new one')
    })

    it('rejects already verified email', async () => {
        prisma.user.findUnique.mockResolvedValue(user())

        const res = await request(app)
            .post('/api/auth/verify-email')
            .send({ userId: USER_ID, code: '123456' })

        expect(res.status).toBe(400)
        expect(res.body.error).toBe('email already verified')
    })

    it('rejects missing code', async () => {
        const res = await request(app)
            .post('/api/auth/verify-email')
            .send({ userId: USER_ID })

        expect(res.status).toBe(400)
        expect(res.body.error).toBeDefined()
    })
})

describe('POST /api/auth/resend-verification', () => {
    let prisma: any
    let sendVerificationEmail: any

    beforeAll(async () => {
        prisma = (await import('../../lib/prisma')).prisma
        sendVerificationEmail = (await import('../../lib/email')).sendVerificationEmail
    })

    it('resends verification code', async () => {
        prisma.user.findUnique.mockResolvedValue(user({ emailVerified: false }))
        prisma.user.update.mockResolvedValue(user())
        sendVerificationEmail.mockResolvedValue(undefined)

        const res = await request(app)
            .post('/api/auth/resend-verification')
            .send({ userId: USER_ID })

        expect(res.status).toBe(200)
        expect(res.body.message).toBe('Verification code sent to your email')
        expect(sendVerificationEmail).toHaveBeenCalledWith('alice@test.com', expect.any(String))
    })

    it('rejects already verified user', async () => {
        prisma.user.findUnique.mockResolvedValue(user())

        const res = await request(app)
            .post('/api/auth/resend-verification')
            .send({ userId: USER_ID })

        expect(res.status).toBe(400)
        expect(res.body.error).toBe('email already verified')
    })

    it('rejects unknown user', async () => {
        prisma.user.findUnique.mockResolvedValue(null)

        const res = await request(app)
            .post('/api/auth/resend-verification')
            .send({ userId: USER_ID_2 })

        expect(res.status).toBe(404)
        expect(res.body.error).toBe('user not found')
    })
})

describe('POST /api/auth/change-password', () => {
    let prisma: any
    let bcryptCompare: any
    let token: string

    beforeAll(async () => {
        prisma = (await import('../../lib/prisma')).prisma
        bcryptCompare = (await import('bcryptjs')).default.compare
        token = jwt.sign({ sub: USER_ID }, 'test-secret')
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
            where: { id: USER_ID },
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

describe('POST /api/auth/delete-account', () => {
    let prisma: any
    let bcryptCompare: any
    let token: string

    beforeAll(async () => {
        prisma = (await import('../../lib/prisma')).prisma
        bcryptCompare = (await import('bcryptjs')).default.compare
        token = jwt.sign({ sub: USER_ID }, 'test-secret')
    })

    it('deletes account and returns success', async () => {
        prisma.user.findUnique.mockResolvedValue(user())
        bcryptCompare.mockResolvedValue(true)
        prisma.user.delete.mockResolvedValue(user())

        const res = await request(app)
            .post('/api/auth/delete-account')
            .set('Authorization', `Bearer ${token}`)
            .send({ password: 'secret123' })

        expect(res.status).toBe(200)
        expect(res.body.message).toBe('account deleted')
        expect(prisma.$transaction).toHaveBeenCalledWith([
            prisma.exercise.deleteMany({ where: { userId: USER_ID } }),
            prisma.day.deleteMany({ where: { userId: USER_ID } }),
            prisma.week.deleteMany({ where: { userId: USER_ID } }),
            prisma.block.deleteMany({ where: { userId: USER_ID } }),
            prisma.program.deleteMany({ where: { userId: USER_ID } }),
            prisma.user.delete({ where: { id: USER_ID } }),
        ])
    })

    it('rejects missing authorization header', async () => {
        const res = await request(app)
            .post('/api/auth/delete-account')
            .send({ password: 'secret123' })

        expect(res.status).toBe(401)
        expect(res.body.error).toBe('missing authorization header')
    })

    it('rejects invalid token', async () => {
        const res = await request(app)
            .post('/api/auth/delete-account')
            .set('Authorization', 'Bearer bad-token')
            .send({ password: 'secret123' })

        expect(res.status).toBe(401)
        expect(res.body.error).toBe('invalid token')
    })

    it('rejects wrong password', async () => {
        prisma.user.findUnique.mockResolvedValue(user())
        bcryptCompare.mockResolvedValue(false)

        const res = await request(app)
            .post('/api/auth/delete-account')
            .set('Authorization', `Bearer ${token}`)
            .send({ password: 'wrong' })

        expect(res.status).toBe(401)
        expect(res.body.error).toBe('password is incorrect')
    })

    it('rejects missing password', async () => {
        const res = await request(app)
            .post('/api/auth/delete-account')
            .set('Authorization', `Bearer ${token}`)
            .send({})

        expect(res.status).toBe(400)
        expect(res.body.error).toBeDefined()
    })

    it('returns 404 for unknown user', async () => {
        prisma.user.findUnique.mockResolvedValue(null)

        const res = await request(app)
            .post('/api/auth/delete-account')
            .set('Authorization', `Bearer ${token}`)
            .send({ password: 'secret123' })

        expect(res.status).toBe(404)
        expect(res.body.error).toBe('user not found')
    })
})
