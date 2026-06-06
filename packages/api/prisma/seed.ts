import bcrypt from 'bcryptjs'

import { prisma } from '../src/lib/prisma'

async function main() {
    await prisma.user.deleteMany()
    const password = await bcrypt.hash('secret', 10)

    const user = await prisma.user.create({
        data: {
            email: 'abdul@gmail.com',
            password,
            username: 'abdul',
            programs: {
                create: {
                    name: '2026 Off-Season Base Building',
                    description:
                        'A 4-block off-season program focused on hypertrophy, strength, and peaking for a powerlifting meet.',
                    blocks: {
                        create: [
                            {
                                name: 'Hypertrophy Block',
                                order: 1,
                                weeks: {
                                    create: [
                                        seedWeek(1, 0, { notes: false, checkIn: true }),
                                        seedWeek(2, 0, { notes: true, checkIn: false }),
                                        seedWeek(3, 0, { notes: false, checkIn: false }),
                                        seedWeek(4, 0, { notes: true, checkIn: true }),
                                    ],
                                },
                            },
                            {
                                name: 'Strength Block',
                                order: 2,
                                weeks: {
                                    create: [
                                        seedWeek(5, 1, { notes: false, checkIn: false }),
                                        seedWeek(6, 1, { notes: true, checkIn: true }),
                                        seedWeek(7, 1, { notes: false, checkIn: false }),
                                        seedWeek(8, 1, { notes: false, checkIn: true }),
                                    ],
                                },
                            },
                            {
                                name: 'Peaking Block',
                                order: 3,
                                weeks: {
                                    create: [
                                        seedWeek(9, 2, { notes: false, checkIn: false }),
                                        seedWeek(10, 2, { notes: true, checkIn: true }),
                                        seedWeek(11, 2, { notes: false, checkIn: false }),
                                        seedWeek(12, 2, { notes: false, checkIn: true }),
                                    ],
                                },
                            },
                            {
                                name: 'Deload & Test',
                                order: 4,
                                weeks: {
                                    create: [seedWeek(13, 3, { notes: false, checkIn: false })],
                                },
                            },
                        ],
                    },
                },
            },
        },
    })

    console.log(`Seeded user: ${user.email} (password: password123)`)
    console.log(`Seeded program: ${'2026 Off-Season Base Building'}`)
}

type Phase = 0 | 1 | 2 | 3
type WeekOptions = { notes: boolean; checkIn: boolean }

function seedWeek(weekNumber: number, phase: Phase, opts: WeekOptions) {
    return {
        weekNumber,
        fatigueIndex: opts.checkIn
            ? {
                  sleep_quality: 4,
                  cognitive_capacity: 3,
                  general_motivation: 4,
                  motivation_to_train: 5,
                  sense_of_wellbeing: 3,
                  perceived_stress: 2,
                  energy_levels: 3,
                  libido: 3,
                  soreness: 4,
              }
            : undefined,
        weeklyCheckIn: opts.checkIn
            ? { bodyweight: 92.5, calories: 3800, sleep_hours: 7.5 }
            : undefined,
        userNotesForCoach: opts.notes
            ? 'Lower back feels tight on deadlift lockout. Might need extra recovery work.'
            : undefined,
        coachNotesForUser: opts.notes
            ? 'Add 10min of glute activation before squat sessions. Consider dropping deficit deadlift this block.'
            : undefined,
        days: {
            create: [
                seedDay(1, 'squat', phase, weekNumber),
                seedDay(2, 'bench', phase, weekNumber),
                seedDay(3, 'deadlift', phase, weekNumber),
                seedDay(4, 'accessory', phase, weekNumber),
            ],
        },
    }
}

const HYPERTROPHY = {
    squat: [
        { name: 'Competition Squat', sets: 4, reps: 6, expectedRpe: 7, loadRange: '70-75%' },
        { name: 'Pause Squat', sets: 3, reps: 8, expectedRpe: 7, loadRange: '60-65%' },
        { name: 'Leg Press', sets: 3, reps: 12, loadRange: '70%' },
        { name: 'Romanian Deadlift', sets: 3, reps: 10, loadRange: '60%' },
        { name: 'Leg Curl', sets: 3, reps: 15, loadRange: '—' },
    ],
    bench: [
        { name: 'Competition Bench', sets: 4, reps: 6, expectedRpe: 7.5, loadRange: '70-75%' },
        { name: 'Close Grip Bench', sets: 3, reps: 8, expectedRpe: 7, loadRange: '65-70%' },
        { name: 'Incline DB Press', sets: 3, reps: 10, loadRange: '65%' },
        { name: 'Tricep Pushdown', sets: 3, reps: 15, loadRange: '—' },
        { name: 'Face Pull', sets: 3, reps: 15, loadRange: '—' },
    ],
    deadlift: [
        { name: 'Competition Deadlift', sets: 4, reps: 5, expectedRpe: 7, loadRange: '70-75%' },
        { name: 'Deficit Deadlift', sets: 3, reps: 6, expectedRpe: 7, loadRange: '60-65%' },
        { name: 'Barbell Row', sets: 4, reps: 8, loadRange: '65%' },
        { name: 'Lat Pulldown', sets: 3, reps: 10, loadRange: '—' },
        { name: 'Back Extension', sets: 3, reps: 12, loadRange: '—' },
    ],
    accessory: [
        { name: 'Standing OHP', sets: 4, reps: 8, expectedRpe: 7, loadRange: '65-70%' },
        { name: 'Front Squat', sets: 3, reps: 8, expectedRpe: 7, loadRange: '60-65%' },
        { name: 'Pull Up', sets: 3, reps: -1, loadRange: 'AMRAP' },
        { name: 'DB Lateral Raise', sets: 3, reps: 15, loadRange: '—' },
        { name: 'Preacher Curl', sets: 3, reps: 12, loadRange: '—' },
    ],
} satisfies Record<string, ExerciseSeed[]>

const STRENGTH = {
    squat: [
        { name: 'Competition Squat', sets: 4, reps: 4, expectedRpe: 8, loadRange: '75-80%' },
        { name: 'Pause Squat', sets: 3, reps: 5, expectedRpe: 7.5, loadRange: '65-70%' },
        { name: 'Leg Press', sets: 3, reps: 10, loadRange: '75%' },
        { name: 'RDL', sets: 3, reps: 8, loadRange: '65%' },
        { name: 'Leg Curl', sets: 3, reps: 12, loadRange: '—' },
    ],
    bench: [
        { name: 'Competition Bench', sets: 4, reps: 4, expectedRpe: 8, loadRange: '75-80%' },
        { name: 'Close Grip Bench', sets: 3, reps: 6, expectedRpe: 7.5, loadRange: '70-75%' },
        { name: 'Incline DB Press', sets: 3, reps: 8, loadRange: '70%' },
        { name: 'Tricep Pushdown', sets: 3, reps: 12, loadRange: '—' },
        { name: 'Face Pull', sets: 3, reps: 12, loadRange: '—' },
    ],
    deadlift: [
        { name: 'Competition Deadlift', sets: 4, reps: 3, expectedRpe: 8, loadRange: '75-80%' },
        { name: 'Deficit Deadlift', sets: 3, reps: 4, expectedRpe: 7.5, loadRange: '65-70%' },
        { name: 'Barbell Row', sets: 4, reps: 6, loadRange: '70%' },
        { name: 'Lat Pulldown', sets: 3, reps: 8, loadRange: '—' },
        { name: 'Back Extension', sets: 3, reps: 10, loadRange: '—' },
    ],
    accessory: [
        { name: 'Standing OHP', sets: 4, reps: 6, expectedRpe: 7.5, loadRange: '70-75%' },
        { name: 'Front Squat', sets: 3, reps: 6, expectedRpe: 7.5, loadRange: '65-70%' },
        { name: 'Pull Up', sets: 3, reps: 6, loadRange: '+15kg' },
        { name: 'DB Lateral Raise', sets: 3, reps: 12, loadRange: '—' },
        { name: 'Preacher Curl', sets: 3, reps: 10, loadRange: '—' },
    ],
} satisfies Record<string, ExerciseSeed[]>

const PEAK = {
    squat: [
        { name: 'Competition Squat', sets: 3, reps: 2, expectedRpe: 9, loadRange: '82-87%' },
        { name: 'Pause Squat', sets: 2, reps: 3, expectedRpe: 8, loadRange: '70-75%' },
        { name: 'Leg Press', sets: 2, reps: 8, loadRange: '80%' },
        { name: 'Leg Curl', sets: 2, reps: 10, loadRange: '—' },
    ],
    bench: [
        { name: 'Competition Bench', sets: 3, reps: 2, expectedRpe: 9, loadRange: '82-87%' },
        { name: 'Close Grip Bench', sets: 2, reps: 4, expectedRpe: 8, loadRange: '72-77%' },
        { name: 'Incline DB Press', sets: 2, reps: 6, loadRange: '75%' },
        { name: 'Tricep Pushdown', sets: 2, reps: 10, loadRange: '—' },
    ],
    deadlift: [
        { name: 'Competition Deadlift', sets: 3, reps: 2, expectedRpe: 9, loadRange: '82-87%' },
        { name: 'Deficit Deadlift', sets: 2, reps: 3, expectedRpe: 8, loadRange: '70-75%' },
        { name: 'Barbell Row', sets: 3, reps: 5, loadRange: '75%' },
        { name: 'Back Extension', sets: 2, reps: 8, loadRange: '—' },
    ],
    accessory: [
        { name: 'Standing OHP', sets: 3, reps: 4, expectedRpe: 8, loadRange: '75-80%' },
        { name: 'Front Squat', sets: 2, reps: 5, expectedRpe: 8, loadRange: '70-75%' },
        { name: 'Pull Up', sets: 2, reps: 5, loadRange: '+20kg' },
        { name: 'DB Lateral Raise', sets: 2, reps: 12, loadRange: '—' },
    ],
} satisfies Record<string, ExerciseSeed[]>

const DELOAD = {
    squat: [
        { name: 'Competition Squat', sets: 2, reps: 5, expectedRpe: 6, loadRange: '50%' },
        { name: 'Leg Press', sets: 2, reps: 12, loadRange: '50%' },
        { name: 'Back Extension', sets: 2, reps: 12, loadRange: '—' },
    ],
    bench: [
        { name: 'Competition Bench', sets: 2, reps: 5, expectedRpe: 6, loadRange: '50%' },
        { name: 'Incline DB Press', sets: 2, reps: 12, loadRange: '50%' },
        { name: 'Tricep Pushdown', sets: 2, reps: 15, loadRange: '—' },
    ],
    deadlift: [
        { name: 'Competition Deadlift', sets: 2, reps: 5, expectedRpe: 6, loadRange: '50%' },
        { name: 'Barbell Row', sets: 2, reps: 10, loadRange: '50%' },
        { name: 'Lat Pulldown', sets: 2, reps: 12, loadRange: '—' },
    ],
    accessory: [
        { name: 'Standing OHP', sets: 2, reps: 8, expectedRpe: 6, loadRange: '50%' },
        { name: 'Pull Up', sets: 2, reps: 8, loadRange: 'BW' },
        { name: 'DB Lateral Raise', sets: 2, reps: 15, loadRange: '—' },
    ],
} satisfies Record<string, ExerciseSeed[]>

const PHASES = [HYPERTROPHY, STRENGTH, PEAK, DELOAD] as const

interface ExerciseSeed {
    name: string
    sets: number
    reps: number
    expectedRpe?: number | null
    loadRange?: string | null
}

interface LoggedExerciseSeed extends ExerciseSeed {
    loadActual: number | null
    rpeActual: number | null
}

const LOGGED_WEEKS = new Set([1, 2, 3, 4, 5])

function seedDay(
    dayNumber: number,
    focus: keyof typeof HYPERTROPHY,
    phase: Phase,
    weekNumber: number,
) {
    const exercises = PHASES[phase][focus]
    const isLogged = LOGGED_WEEKS.has(weekNumber)

    return {
        dayNumber,
        exercises: {
            create: exercises.map((ex, i) => {
                const base: LoggedExerciseSeed = {
                    ...ex,
                    loadActual: null,
                    rpeActual: null,
                }

                if (isLogged && !base.loadRange?.startsWith('—')) {
                    base.loadActual = [140, 145, 150, 155, 160, 165, 170, 175][i % 8] ?? null
                    base.rpeActual =
                        base.expectedRpe != null ? +(base.expectedRpe + 0.5).toFixed(1) : null
                }

                return {
                    name: base.name,
                    sets: base.sets,
                    reps: base.reps,
                    expectedRpe: base.expectedRpe ?? null,
                    loadRange: base.loadRange ?? null,
                    loadActual: base.loadActual,
                    rpeActual: base.rpeActual,
                    order: i + 1,
                }
            }),
        },
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
