import { Router } from 'express'
import { z } from 'zod'

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

const idParamSchema = z.object({ id: z.string().uuid() })

programRouter.get('/:id', requireAuth, async (req, res) => {
    const parsed = idParamSchema.safeParse(req.params)
    if (!parsed.success) {
        res.status(400).json({ error: 'invalid program id' })
        return
    }

    const { userId } = req as AuthenticatedRequest

    const program = await prisma.program.findFirst({
        where: { id: parsed.data.id, userId },
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

    if (!program) {
        res.status(404).json({ error: 'program not found' })
        return
    }

    res.json(program)
})
