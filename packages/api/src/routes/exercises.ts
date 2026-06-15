import { Router } from 'express'
import { z } from 'zod'

import { requireAuth } from '../middleware/auth.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'

export const exerciseRouter = Router()

exerciseRouter.get('/', requireAuth, async (req, res) => {
    const exercises = await prisma.exercise.findMany({
        select: { name: true },
        distinct: ['name'],
    })

    res.json(exercises.map((e) => e.name))
})

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
