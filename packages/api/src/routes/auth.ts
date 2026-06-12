import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { prisma } from '../lib/prisma'
import { sendVerificationEmail } from '../lib/email'
import { type AuthenticatedRequest, requireAuth } from '../middleware/auth'

export const authRouter = Router()

function generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

function generateToken(userId: string): string {
    return jwt.sign({ sub: userId }, process.env.JWT_SECRET!)
}

const signinSchema = z.object({
    email: z.string().email(),
    password: z.string(),
    role: z.enum(['athlete', 'coach']).optional(),
})

authRouter.post('/signin', async (req, res) => {
    const parsed = signinSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors })
        return
    }

    const { email, password, role } = parsed.data

    const user = await prisma.user.findFirst({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ error: 'invalid email or password' })
        return
    }

    if (!user.emailVerified) {
        res.status(403).json({ error: 'email not verified', userId: user.id, email: user.email })
        return
    }

    if (role && user.role !== role) {
        res.status(403).json({ error: `this account does not have the ${role} role` })
        return
    }

    const token = generateToken(user.id)

    res.json({
        token,
        user: { id: user.id, email: user.email, username: user.username, role: user.role },
    })
})

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    username: z.string().min(2),
    role: z.enum(['athlete', 'coach']).default('athlete'),
})

authRouter.post('/signup', async (req, res) => {
    const parsed = signupSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors })
        return
    }

    const { email, password, username, role } = parsed.data

    const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
    })
    if (existing) {
        res.status(409).json({ error: 'email or username already exists' })
        return
    }

    const hashed = await bcrypt.hash(password, 10)
    const code = generateCode()
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000)

    const user = await prisma.user.create({
        data: {
            email,
            password: hashed,
            username,
            role,
            emailVerificationCode: code,
            emailVerificationCodeExpiry: codeExpiry,
        },
    })

    await sendVerificationEmail(user.email, code)

    res.status(201).json({
        userId: user.id,
        email: user.email,
        message: 'Verification code sent to your email',
    })
})

const verifyEmailSchema = z.object({
    userId: z.string().uuid(),
    code: z.string().length(6),
})

authRouter.post('/verify-email', async (req, res) => {
    const parsed = verifyEmailSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors })
        return
    }

    const { userId, code } = parsed.data

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
        res.status(404).json({ error: 'user not found' })
        return
    }

    if (user.emailVerified) {
        res.status(400).json({ error: 'email already verified' })
        return
    }

    if (!user.emailVerificationCode || !user.emailVerificationCodeExpiry) {
        res.status(400).json({ error: 'no verification code found. Please request a new one' })
        return
    }

    if (user.emailVerificationCode !== code) {
        res.status(400).json({ error: 'invalid verification code' })
        return
    }

    if (user.emailVerificationCodeExpiry < new Date()) {
        res.status(400).json({ error: 'verification code has expired. Please request a new one' })
        return
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: true,
            emailVerificationCode: null,
            emailVerificationCodeExpiry: null,
        },
    })

    const token = generateToken(user.id)

    res.json({
        token,
        user: { id: user.id, email: user.email, username: user.username, role: user.role },
    })
})

const resendVerificationSchema = z.object({
    userId: z.string().uuid(),
})

authRouter.post('/resend-verification', async (req, res) => {
    const parsed = resendVerificationSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors })
        return
    }

    const { userId } = parsed.data

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
        res.status(404).json({ error: 'user not found' })
        return
    }

    if (user.emailVerified) {
        res.status(400).json({ error: 'email already verified' })
        return
    }

    const code = generateCode()
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerificationCode: code,
            emailVerificationCodeExpiry: codeExpiry,
        },
    })

    await sendVerificationEmail(user.email, code)

    res.json({ message: 'Verification code sent to your email' })
})

const changePasswordSchema = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(6),
})

authRouter.post('/change-password', requireAuth, async (req, res) => {
    const { userId } = req as unknown as AuthenticatedRequest

    const parsed = changePasswordSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors })
        return
    }

    const { currentPassword, newPassword } = parsed.data

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
        res.status(404).json({ error: 'user not found' })
        return
    }

    if (!(await bcrypt.compare(currentPassword, user.password))) {
        res.status(401).json({ error: 'current password is incorrect' })
        return
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashed },
    })

    res.json({ message: 'password changed' })
})

const deleteAccountSchema = z.object({
    password: z.string(),
})

authRouter.post('/delete-account', requireAuth, async (req, res) => {
    const { userId } = req as unknown as AuthenticatedRequest

    const parsed = deleteAccountSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors })
        return
    }

    const { password } = parsed.data

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
        res.status(404).json({ error: 'user not found' })
        return
    }

    if (!(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ error: 'password is incorrect' })
        return
    }

    await prisma.$transaction([
        prisma.exercise.deleteMany({ where: { userId } }),
        prisma.day.deleteMany({ where: { userId } }),
        prisma.week.deleteMany({ where: { userId } }),
        prisma.block.deleteMany({ where: { userId } }),
        prisma.program.deleteMany({ where: { userId } }),
        prisma.user.delete({ where: { id: userId } }),
    ])

    res.json({ message: 'account deleted' })
})
