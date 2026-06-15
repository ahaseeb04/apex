import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { type AuthenticatedRequest, requireAuth } from '../middleware/auth.js'

export const userRouter = Router()

userRouter.get('/', requireAuth, async (req, res) => {
    const { userId } = req as unknown as AuthenticatedRequest

    const currentUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!currentUser || currentUser.role !== 'coach') {
        res.status(403).json({ error: 'only coaches can view users' })
        return
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            username: true,
            role: true,
            emailVerified: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
    })

    res.json(users)
})
