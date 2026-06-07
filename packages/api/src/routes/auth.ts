import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { prisma } from '../lib/prisma'
import { type AuthenticatedRequest, requireAuth } from '../middleware/auth'

export const authRouter = Router()

const signinSchema = z.object({
    email: z.string().email(),
    password: z.string(),
})

authRouter.post('/signin', async (req, res) => {
    const parsed = signinSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors })
        return
    }

    const { email, password } = parsed.data

    const user = await prisma.user.findFirst({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ error: 'invalid email or password' })
        return
    }

    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, {
        expiresIn: '7d',
    })

    res.json({
        token,
        user: { id: user.id, email: user.email, username: user.username },
    })
})

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    username: z.string().min(2),
})

authRouter.post('/signup', async (req, res) => {
    const parsed = signupSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors })
        return
    }

    const { email, password, username } = parsed.data

    const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
    })
    if (existing) {
        res.status(409).json({ error: 'email or username already exists' })
        return
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
        data: { email, password: hashed, username },
    })

    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, {
        expiresIn: '7d',
    })

    res.status(201).json({
        token,
        user: { id: user.id, email: user.email, username: user.username },
    })
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
