import { Router } from 'express'
import { z } from 'zod'

import { requireAuth } from '../middleware/auth'
import type { AuthenticatedRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const exerciseRouter = Router()

const updateSchema = z.object({
    loadActual: z.number().nullable().optional(),
    rpeActual: z.number().nullable().optional(),
})

exerciseRouter.patch('/:id', requireAuth, async (req, res) => {
    const id = req.params.id as string

    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors })
        return
    }

    const exercise = await prisma.exercise.findUnique({
        where: { id },
        select: { userId: true },
    })

    if (!exercise || exercise.userId !== (req as AuthenticatedRequest).userId) {
        res.status(404).json({ error: 'exercise not found' })
        return
    }

    const updated = await prisma.exercise.update({
        where: { id },
        data: parsed.data,
    })

    res.json(updated)
})
