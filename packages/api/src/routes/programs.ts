import { Router } from 'express'

import { requireAuth } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import type { AuthenticatedRequest } from '../middleware/auth'

export const programRouter = Router()

programRouter.get('/', requireAuth, async (req, res) => {
    const { userId } = req as AuthenticatedRequest

    const programs = await prisma.program.findMany({
        where: { userId },
        include: {
            blocks: {
                orderBy: { order: 'asc' },
                include: {
                    weeks: {
                        orderBy: { weekNumber: 'asc' },
                        include: {
                            days: {
                                orderBy: { dayNumber: 'asc' },
                                include: {
                                    exercises: {
                                        orderBy: { order: 'asc' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    })

    res.json(programs)
})
