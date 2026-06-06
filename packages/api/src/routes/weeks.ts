import { Router } from 'express'
import { z } from 'zod'

import { requireAuth } from '../middleware/auth'
import type { AuthenticatedRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

export const weekRouter = Router()

const updateSchema = z.object({
    userNotesForCoach: z.string().nullable().optional(),
    fatigueIndex: z
        .object({
            sleep_quality: z.number().min(0).max(5),
            cognitive_capacity: z.number().min(0).max(5),
            general_motivation: z.number().min(0).max(5),
            motivation_to_train: z.number().min(0).max(5),
            sense_of_wellbeing: z.number().min(0).max(5),
            perceived_stress: z.number().min(0).max(5),
            energy_levels: z.number().min(0).max(5),
            libido: z.number().min(0).max(5),
            soreness: z.number().min(0).max(5),
        })
        .nullable()
        .optional(),
    weeklyCheckIn: z
        .object({
            bodyweight: z.number(),
            calories: z.number(),
            sleep_hours: z.number(),
        })
        .nullable()
        .optional(),
})

weekRouter.patch('/:id', requireAuth, async (req, res) => {
    const id = req.params.id as string

    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors })
        return
    }

    const week = await prisma.week.findUnique({
        where: { id },
        select: { userId: true },
    })

    if (!week || week.userId !== (req as AuthenticatedRequest).userId) {
        res.status(404).json({ error: 'week not found' })
        return
    }

    const data = parsed.data
    const updateData: Record<string, unknown> = {}
    if (data.userNotesForCoach !== undefined) updateData.userNotesForCoach = data.userNotesForCoach
    if (data.fatigueIndex !== undefined) updateData.fatigueIndex = data.fatigueIndex
    if (data.weeklyCheckIn !== undefined) updateData.weeklyCheckIn = data.weeklyCheckIn

    const updated = await prisma.week.update({
        where: { id },
        data: updateData,
        include: { days: { include: { exercises: { orderBy: { order: 'asc' } } }, orderBy: { dayNumber: 'asc' } } },
    })

    res.json(updated)
})
