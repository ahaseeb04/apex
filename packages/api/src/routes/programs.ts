import { Router } from 'express'
import { z } from 'zod'

import { requireAuth } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'

export const programRouter = Router()

programRouter.get('/', requireAuth, async (req, res) => {
    const { userId: authUserId } = req as AuthenticatedRequest
    const targetUserId = typeof req.query.userId === 'string' ? req.query.userId : undefined

    if (targetUserId) {
        const currentUser = await prisma.user.findUnique({ where: { id: authUserId } })
        if (!currentUser || currentUser.role !== 'coach') {
            res.status(403).json({ error: 'only coaches can view other users programs' })
            return
        }
    }

    const userId = targetUserId ?? authUserId

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

const exerciseSchema = z.object({
    name: z.string().min(1),
    sets: z.number().int().min(0),
    reps: z.number().int().min(0),
    expectedRpe: z.number().nullable().optional(),
    loadRange: z.string().nullable().optional(),
    loadActual: z.number().nullable().optional(),
    rpeActual: z.number().nullable().optional(),
    order: z.number().int().min(0),
})

const daySchema = z.object({
    dayNumber: z.number().int().min(1),
    exercises: z.array(exerciseSchema),
})

const fatigueIndexSchema = z
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

const weeklyCheckInSchema = z
    .object({
        bodyweight: z.number(),
        calories: z.number(),
        sleep_hours: z.number(),
    })
    .nullable()

const weekSchema = z.object({
    weekNumber: z.number().int().min(1),
    coachNotesForUser: z.string().nullable().optional(),
    userNotesForCoach: z.string().nullable().optional(),
    fatigueIndex: fatigueIndexSchema.optional(),
    weeklyCheckIn: weeklyCheckInSchema.optional(),
    days: z.array(daySchema),
})

const blockSchema = z.object({
    name: z.string().min(1),
    order: z.number().int().min(0),
    weeks: z.array(weekSchema),
})

const createProgramSchema = z.object({
    userId: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().nullable().optional(),
    blocks: z.array(blockSchema),
})

const updateProgramSchema = z.object({
    name: z.string().min(1),
    description: z.string().nullable().optional(),
    blocks: z.array(blockSchema),
})

const programInclude = {
    blocks: {
        orderBy: { order: 'asc' as const },
        include: {
            weeks: {
                orderBy: { weekNumber: 'asc' as const },
                include: {
                    days: {
                        orderBy: { dayNumber: 'asc' as const },
                        include: {
                            exercises: {
                                orderBy: { order: 'asc' as const },
                            },
                        },
                    },
                },
            },
        },
    },
}

programRouter.post('/', requireAuth, async (req, res) => {
    const parsed = createProgramSchema.safeParse(req.body)
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten().fieldErrors })
        return
    }

    const { userId: authUserId } = req as AuthenticatedRequest
    const currentUser = await prisma.user.findUnique({ where: { id: authUserId } })
    if (!currentUser || currentUser.role !== 'coach') {
        res.status(403).json({ error: 'only coaches can create programs' })
        return
    }

    const { userId: targetUserId, name, description, blocks: blocksData } = parsed.data

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!targetUser) {
        res.status(404).json({ error: 'user not found' })
        return
    }

    const program = await prisma.program.create({
        data: {
            name,
            description: description ?? null,
            userId: targetUserId,
            blocks: {
                create: blocksData.map((block) => ({
                    name: block.name,
                    order: block.order,
                    user: { connect: { id: authUserId } },
                    weeks: {
                        create: block.weeks.map((week) => ({
                            weekNumber: week.weekNumber,
                            coachNotesForUser: week.coachNotesForUser ?? null,
                            userNotesForCoach: week.userNotesForCoach ?? null,
                            ...(week.fatigueIndex != null
                                ? { fatigueIndex: week.fatigueIndex }
                                : {}),
                            ...(week.weeklyCheckIn != null
                                ? { weeklyCheckIn: week.weeklyCheckIn }
                                : {}),
                            user: { connect: { id: authUserId } },
                            days: {
                                create: week.days.map((day) => ({
                                    dayNumber: day.dayNumber,
                                    user: { connect: { id: authUserId } },
                                    exercises: {
                                        create: day.exercises.map((exercise) => ({
                                            name: exercise.name,
                                            sets: exercise.sets,
                                            reps: exercise.reps,
                                            expectedRpe: exercise.expectedRpe ?? null,
                                            loadRange: exercise.loadRange ?? null,
                                            loadActual: exercise.loadActual ?? null,
                                            rpeActual: exercise.rpeActual ?? null,
                                            order: exercise.order,
                                            user: { connect: { id: authUserId } },
                                        })),
                                    },
                                })),
                            },
                        })),
                    },
                })),
            },
        },
        include: programInclude,
    })

    res.status(201).json(program)
})

programRouter.patch('/:id', requireAuth, async (req, res) => {
    const idParsed = idParamSchema.safeParse(req.params)
    if (!idParsed.success) {
        res.status(400).json({ error: 'invalid program id' })
        return
    }

    const bodyParsed = updateProgramSchema.safeParse(req.body)
    if (!bodyParsed.success) {
        res.status(400).json({ error: bodyParsed.error.flatten().fieldErrors })
        return
    }

    const { userId: authUserId } = req as AuthenticatedRequest
    const currentUser = await prisma.user.findUnique({ where: { id: authUserId } })
    if (!currentUser || currentUser.role !== 'coach') {
        res.status(403).json({ error: 'only coaches can update programs' })
        return
    }

    const program = await prisma.program.findUnique({
        where: { id: idParsed.data.id },
    })

    if (!program) {
        res.status(404).json({ error: 'program not found' })
        return
    }

    const { name, description, blocks: blocksData } = bodyParsed.data

    await prisma.$transaction([
        prisma.exercise.deleteMany({
            where: { day: { week: { block: { programId: program.id } } } },
        }),
        prisma.day.deleteMany({ where: { week: { block: { programId: program.id } } } }),
        prisma.week.deleteMany({ where: { block: { programId: program.id } } }),
        prisma.block.deleteMany({ where: { programId: program.id } }),
    ])

    const updated = await prisma.program.update({
        where: { id: program.id },
        data: {
            name,
            description: description ?? null,
            blocks: {
                create: blocksData.map((block) => ({
                    name: block.name,
                    order: block.order,
                    user: { connect: { id: authUserId } },
                    weeks: {
                        create: block.weeks.map((week) => ({
                            weekNumber: week.weekNumber,
                            coachNotesForUser: week.coachNotesForUser ?? null,
                            userNotesForCoach: week.userNotesForCoach ?? null,
                            ...(week.fatigueIndex != null
                                ? { fatigueIndex: week.fatigueIndex }
                                : {}),
                            ...(week.weeklyCheckIn != null
                                ? { weeklyCheckIn: week.weeklyCheckIn }
                                : {}),
                            user: { connect: { id: authUserId } },
                            days: {
                                create: week.days.map((day) => ({
                                    dayNumber: day.dayNumber,
                                    user: { connect: { id: authUserId } },
                                    exercises: {
                                        create: day.exercises.map((exercise) => ({
                                            name: exercise.name,
                                            sets: exercise.sets,
                                            reps: exercise.reps,
                                            expectedRpe: exercise.expectedRpe ?? null,
                                            loadRange: exercise.loadRange ?? null,
                                            loadActual: exercise.loadActual ?? null,
                                            rpeActual: exercise.rpeActual ?? null,
                                            order: exercise.order,
                                            user: { connect: { id: authUserId } },
                                        })),
                                    },
                                })),
                            },
                        })),
                    },
                })),
            },
        },
        include: programInclude,
    })

    res.json(updated)
})

programRouter.delete('/:id', requireAuth, async (req, res) => {
    const parsed = idParamSchema.safeParse(req.params)
    if (!parsed.success) {
        res.status(400).json({ error: 'invalid program id' })
        return
    }

    const { userId: authUserId } = req as AuthenticatedRequest
    const currentUser = await prisma.user.findUnique({ where: { id: authUserId } })
    if (!currentUser || currentUser.role !== 'coach') {
        res.status(403).json({ error: 'only coaches can delete programs' })
        return
    }

    const program = await prisma.program.findUnique({
        where: { id: parsed.data.id },
    })

    if (!program) {
        res.status(404).json({ error: 'program not found' })
        return
    }

    await prisma.program.delete({
        where: { id: program.id },
    })

    res.json({ message: 'program deleted' })
})
