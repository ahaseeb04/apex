import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { prisma } from '../lib/prisma'

export const authRouter = Router()

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    username: z.string().min(2),
})

const signinSchema = z.object({
    email: z.string().email(),
    password: z.string(),
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
