'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
    createProgram,
    updateProgram,
    type DayData,
    type ExerciseData,
    type Program,
} from '@/lib/api'

let keyCounter = 0
function nextKey() {
    return `_${++keyCounter}`
}

interface ExerciseEntry {
    _key: string
    id?: string
    name: string
    sets: string
    reps: string
    expectedRpe: string
    loadRange: string
    loadActual: string
    rpeActual: string
}

interface DayEntry {
    _key: string
    id?: string
    dayNumber: number
    exercises: ExerciseEntry[]
}

interface WeekEntry {
    _key: string
    id?: string
    weekNumber: number
    coachNotesForUser: string
    userNotesForCoach: string
    days: DayEntry[]
}

interface BlockEntry {
    _key: string
    id?: string
    name: string
    weeks: WeekEntry[]
}

function emptyExercise(): ExerciseEntry {
    return {
        _key: nextKey(),
        name: '',
        sets: '',
        reps: '',
        expectedRpe: '',
        loadRange: '',
        loadActual: '',
        rpeActual: '',
    }
}

function emptyDay(dayNumber: number): DayEntry {
    return {
        _key: nextKey(),
        dayNumber,
        exercises: [],
    }
}

function emptyWeek(weekNumber: number): WeekEntry {
    return {
        _key: nextKey(),
        weekNumber,
        coachNotesForUser: '',
        userNotesForCoach: '',
        days: [emptyDay(1)],
    }
}

function emptyBlock(order: number): BlockEntry {
    return {
        _key: nextKey(),
        name: `Block ${order}`,
        weeks: [emptyWeek(1)],
    }
}

function fromProgram(p: Program): {
    name: string
    description: string
    blocks: BlockEntry[]
} {
    return {
        name: p.name,
        description: p.description ?? '',
        blocks: p.blocks.map((b) => ({
            _key: b.id,
            id: b.id,
            name: b.name,
            weeks: b.weeks.map((w) => ({
                _key: w.id,
                id: w.id,
                weekNumber: w.weekNumber,
                coachNotesForUser: w.coachNotesForUser ?? '',
                userNotesForCoach: w.userNotesForCoach ?? '',
                days: w.days.map((d: DayData) => ({
                    _key: d.id,
                    id: d.id,
                    dayNumber: d.dayNumber,
                    exercises: (d.exercises ?? []).map((e: ExerciseData) => ({
                        _key: e.id,
                        id: e.id,
                        name: e.name,
                        sets: String(e.sets ?? ''),
                        reps: String(e.reps ?? ''),
                        expectedRpe: e.expectedRpe != null ? String(e.expectedRpe) : '',
                        loadRange: e.loadRange ?? '',
                        loadActual: e.loadActual != null ? String(e.loadActual) : '',
                        rpeActual: e.rpeActual != null ? String(e.rpeActual) : '',
                    })),
                })),
            })),
        })),
    }
}

function toCreatePayload(userId: string, name: string, description: string, blocks: BlockEntry[]) {
    return {
        userId,
        name,
        description: description || null,
        blocks: blocks.map((b, bi) => ({
            name: b.name,
            order: bi,
            weeks: b.weeks.map((w) => ({
                weekNumber: w.weekNumber,
                coachNotesForUser: w.coachNotesForUser || null,
                days: w.days.map((d) => ({
                    dayNumber: d.dayNumber,
                    exercises: d.exercises
                        .filter((e) => e.name.trim())
                        .map((e, ei) => ({
                            name: e.name.trim(),
                            sets: Number(e.sets) || 0,
                            reps: Number(e.reps) || 0,
                            expectedRpe: e.expectedRpe.trim() ? Number(e.expectedRpe) : null,
                            loadRange: e.loadRange || null,
                            order: ei,
                        })),
                })),
            })),
        })),
    }
}

function toUpdatePayload(name: string, description: string, blocks: BlockEntry[]) {
    return {
        name,
        description: description || null,
        blocks: blocks.map((b, bi) => ({
            ...(b.id ? { id: b.id } : {}),
            name: b.name,
            order: bi,
            weeks: b.weeks.map((w) => ({
                ...(w.id ? { id: w.id } : {}),
                weekNumber: w.weekNumber,
                coachNotesForUser: w.coachNotesForUser || null,
                days: w.days.map((d) => ({
                    ...(d.id ? { id: d.id } : {}),
                    dayNumber: d.dayNumber,
                    exercises: d.exercises
                        .filter((e) => e.name.trim())
                        .map((e, ei) => ({
                            ...(e.id ? { id: e.id } : {}),
                            name: e.name.trim(),
                            sets: Number(e.sets) || 0,
                            reps: Number(e.reps) || 0,
                            expectedRpe: e.expectedRpe.trim() ? Number(e.expectedRpe) : null,
                            loadRange: e.loadRange || null,
                            order: ei,
                        })),
                })),
            })),
        })),
    }
}

export function ProgramForm({ userId, program }: { userId: string; program?: Program }) {
    const router = useRouter()
    const initial = program
        ? fromProgram(program)
        : { name: '', description: '', blocks: [emptyBlock(1)] }

    const [name, setName] = useState(initial.name)
    const [description, setDescription] = useState(initial.description)
    const [blocks, setBlocks] = useState<BlockEntry[]>(initial.blocks)
    const [selectedBlockIdx, setSelectedBlockIdx] = useState(0)
    const [selectedWeekIdx, setSelectedWeekIdx] = useState(0)
    const [selectedDayIdx, setSelectedDayIdx] = useState(0)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const selectedBlock = blocks[selectedBlockIdx]
    const selectedWeek = selectedBlock?.weeks[selectedWeekIdx]
    const selectedDay = selectedWeek?.days[selectedDayIdx]

    const addBlock = useCallback(() => {
        setBlocks((prev) => [...prev, emptyBlock(prev.length + 1)])
        setSelectedBlockIdx(blocks.length)
        setSelectedWeekIdx(0)
        setSelectedDayIdx(0)
    }, [blocks.length])

    const removeBlock = useCallback(
        (idx: number) => {
            if (blocks.length <= 1) return
            setBlocks((prev) => prev.filter((_, i) => i !== idx))
            if (selectedBlockIdx >= idx) {
                setSelectedBlockIdx(Math.max(0, selectedBlockIdx - 1))
                setSelectedWeekIdx(0)
                setSelectedDayIdx(0)
            }
        },
        [blocks.length, selectedBlockIdx],
    )

    const addWeek = useCallback(() => {
        setBlocks((prev) => {
            const block = prev[selectedBlockIdx]
            if (!block) return prev
            const nextNumber =
                block.weeks.length > 0 ? Math.max(...block.weeks.map((w) => w.weekNumber)) + 1 : 1
            const newBlocks = [...prev]
            newBlocks[selectedBlockIdx] = {
                ...block,
                weeks: [...block.weeks, emptyWeek(nextNumber)],
            }
            setSelectedWeekIdx(block.weeks.length)
            setSelectedDayIdx(0)
            return newBlocks
        })
    }, [selectedBlockIdx])

    const removeWeek = useCallback(
        (idx: number) => {
            setBlocks((prev) => {
                const block = prev[selectedBlockIdx]
                if (!block || block.weeks.length <= 1) return prev
                const newBlocks = [...prev]
                newBlocks[selectedBlockIdx] = {
                    ...block,
                    weeks: block.weeks.filter((_, i) => i !== idx),
                }
                if (selectedWeekIdx >= idx) {
                    setSelectedWeekIdx(Math.max(0, selectedWeekIdx - 1))
                    setSelectedDayIdx(0)
                }
                return newBlocks
            })
        },
        [selectedBlockIdx, selectedWeekIdx],
    )

    const addDay = useCallback(() => {
        setBlocks((prev) => {
            const block = prev[selectedBlockIdx]
            if (!block) return prev
            const week = block.weeks[selectedWeekIdx]
            if (!week) return prev
            const nextNumber =
                week.days.length > 0 ? Math.max(...week.days.map((d) => d.dayNumber)) + 1 : 1
            const newBlocks = [...prev]
            const newWeeks = [...block.weeks]
            newWeeks[selectedWeekIdx] = {
                ...week,
                days: [...week.days, emptyDay(nextNumber)],
            }
            newBlocks[selectedBlockIdx] = { ...block, weeks: newWeeks }
            setSelectedDayIdx(week.days.length)
            return newBlocks
        })
    }, [selectedBlockIdx, selectedWeekIdx])

    const removeDay = useCallback(
        (idx: number) => {
            setBlocks((prev) => {
                const block = prev[selectedBlockIdx]
                if (!block) return prev
                const week = block.weeks[selectedWeekIdx]
                if (!week || week.days.length <= 1) return prev
                const newBlocks = [...prev]
                const newWeeks = [...block.weeks]
                newWeeks[selectedWeekIdx] = {
                    ...week,
                    days: week.days.filter((_, i) => i !== idx),
                }
                newBlocks[selectedBlockIdx] = { ...block, weeks: newWeeks }
                if (selectedDayIdx >= idx) {
                    setSelectedDayIdx(Math.max(0, selectedDayIdx - 1))
                }
                return newBlocks
            })
        },
        [selectedBlockIdx, selectedWeekIdx, selectedDayIdx],
    )

    const addExercise = useCallback(() => {
        setBlocks((prev) => {
            const block = prev[selectedBlockIdx]
            if (!block) return prev
            const week = block.weeks[selectedWeekIdx]
            if (!week) return prev
            const day = week.days[selectedDayIdx]
            if (!day) return prev
            const newBlocks = [...prev]
            const newWeeks = [...block.weeks]
            const newDays = [...week.days]
            newDays[selectedDayIdx] = {
                ...day,
                exercises: [...day.exercises, emptyExercise()],
            }
            newWeeks[selectedWeekIdx] = { ...week, days: newDays }
            newBlocks[selectedBlockIdx] = { ...block, weeks: newWeeks }
            return newBlocks
        })
    }, [selectedBlockIdx, selectedWeekIdx, selectedDayIdx])

    const removeExercise = useCallback(
        (idx: number) => {
            setBlocks((prev) => {
                const block = prev[selectedBlockIdx]
                if (!block) return prev
                const week = block.weeks[selectedWeekIdx]
                if (!week) return prev
                const day = week.days[selectedDayIdx]
                if (!day) return prev
                const newBlocks = [...prev]
                const newWeeks = [...block.weeks]
                const newDays = [...week.days]
                newDays[selectedDayIdx] = {
                    ...day,
                    exercises: day.exercises.filter((_, i) => i !== idx),
                }
                newWeeks[selectedWeekIdx] = { ...week, days: newDays }
                newBlocks[selectedBlockIdx] = { ...block, weeks: newWeeks }
                return newBlocks
            })
        },
        [selectedBlockIdx, selectedWeekIdx, selectedDayIdx],
    )

    const updateExercise = useCallback(
        (idx: number, field: keyof ExerciseEntry, value: string) => {
            setBlocks((prev) => {
                const block = prev[selectedBlockIdx]
                if (!block) return prev
                const week = block.weeks[selectedWeekIdx]
                if (!week) return prev
                const day = week.days[selectedDayIdx]
                if (!day) return prev
                const newBlocks = [...prev]
                const newWeeks = [...block.weeks]
                const newDays = [...week.days]
                newDays[selectedDayIdx] = {
                    ...day,
                    exercises: day.exercises.map((e, i) =>
                        i === idx ? { ...e, [field]: value } : e,
                    ),
                }
                newWeeks[selectedWeekIdx] = { ...week, days: newDays }
                newBlocks[selectedBlockIdx] = { ...block, weeks: newWeeks }
                return newBlocks
            })
        },
        [selectedBlockIdx, selectedWeekIdx, selectedDayIdx],
    )

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (!name.trim()) {
            setError('Program name is required')
            return
        }

        setSaving(true)
        try {
            if (program) {
                await updateProgram(program.id, toUpdatePayload(name.trim(), description, blocks))
            } else {
                await createProgram(toCreatePayload(userId, name.trim(), description, blocks))
            }
            router.push(`/users/${userId}/programs`)
            router.refresh()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save program')
        } finally {
            setSaving(false)
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-6">
                <SectionLabel>Program</SectionLabel>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Program name"
                    className="h-12 text-lg font-semibold tracking-tight"
                />
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Program description"
                    className="min-h-20"
                />

                <SectionLabel>Blocks</SectionLabel>
                <div className="flex items-center gap-2 overflow-x-auto py-1.5">
                    {blocks.map((block, idx) => (
                        <div key={block._key} className="relative shrink-0">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedBlockIdx(idx)
                                    setSelectedWeekIdx(0)
                                    setSelectedDayIdx(0)
                                }}
                                className={cn(
                                    'rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                                    idx === selectedBlockIdx
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary text-secondary-foreground hover:bg-muted',
                                )}
                            >
                                {block.name || `Block ${idx + 1}`}
                            </button>
                            {blocks.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeBlock(idx)}
                                    className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80"
                                >
                                    <Trash2Icon className="size-2.5" />
                                </button>
                            )}
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="icon-sm" onClick={addBlock}>
                        <PlusIcon className="size-4" />
                    </Button>
                </div>

                {selectedBlock && (
                    <>
                        <Input
                            value={selectedBlock.name}
                            onChange={(e) =>
                                setBlocks((prev) =>
                                    prev.map((b, i) =>
                                        i === selectedBlockIdx ? { ...b, name: e.target.value } : b,
                                    ),
                                )
                            }
                            placeholder="Block name"
                            className="h-9"
                        />

                        <SectionLabel>Week & Day</SectionLabel>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex gap-2">
                                <Select
                                    value={String(selectedWeekIdx)}
                                    onValueChange={(v) => {
                                        setSelectedWeekIdx(Number(v))
                                        setSelectedDayIdx(0)
                                    }}
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue>
                                            {selectedWeek
                                                ? `Week ${selectedWeek.weekNumber}`
                                                : 'Week'}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedBlock.weeks.map((w, i) => (
                                            <SelectItem key={w._key} value={String(i)}>
                                                Week {w.weekNumber}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon-sm"
                                    onClick={addWeek}
                                >
                                    <PlusIcon className="size-4" />
                                </Button>
                                {selectedBlock.weeks.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon-sm"
                                        onClick={() => removeWeek(selectedWeekIdx)}
                                    >
                                        <Trash2Icon className="size-4" />
                                    </Button>
                                )}
                            </div>

                            {selectedWeek && (
                                <div className="flex gap-2">
                                    <Select
                                        value={String(selectedDayIdx)}
                                        onValueChange={(v) => setSelectedDayIdx(Number(v))}
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue>
                                                {selectedDay
                                                    ? `Day ${selectedDay.dayNumber}`
                                                    : 'Day'}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedWeek.days.map((d, i) => (
                                                <SelectItem key={d._key} value={String(i)}>
                                                    Day {d.dayNumber}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon-sm"
                                        onClick={addDay}
                                    >
                                        <PlusIcon className="size-4" />
                                    </Button>
                                    {selectedWeek.days.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon-sm"
                                            onClick={() => removeDay(selectedDayIdx)}
                                        >
                                            <Trash2Icon className="size-4" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedDay && (
                            <>
                                <SectionLabel>Exercises</SectionLabel>
                                <div className="rounded-xl border border-border overflow-hidden">
                                    <table className="w-full caption-bottom text-sm">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="h-9 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Exercise
                                                </th>
                                                <th className="h-9 w-14 px-2 text-center align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Sets
                                                </th>
                                                <th className="h-9 w-14 px-2 text-center align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Reps
                                                </th>
                                                <th className="h-9 w-14 px-2 text-center align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    RPE
                                                </th>
                                                <th className="h-9 w-20 px-2 text-center align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Load
                                                </th>
                                                <th className="h-9 w-14 px-1 text-center align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    Actual
                                                </th>
                                                <th className="h-9 w-12 px-1 text-center align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    rRPE
                                                </th>
                                                <th className="h-9 w-10" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedDay.exercises.map((ex, i) => (
                                                <tr
                                                    key={ex._key}
                                                    className={
                                                        i < selectedDay.exercises.length - 1
                                                            ? 'border-b border-border'
                                                            : ''
                                                    }
                                                >
                                                    <td className="p-2 pl-3">
                                                        <Input
                                                            value={ex.name}
                                                            onChange={(e) =>
                                                                updateExercise(
                                                                    i,
                                                                    'name',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="Exercise name"
                                                            className="h-8 border-0 px-1 text-sm shadow-none focus-visible:ring-0"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <Input
                                                            value={ex.sets}
                                                            onChange={(e) =>
                                                                updateExercise(
                                                                    i,
                                                                    'sets',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="-"
                                                            className="h-8 border-0 px-1 text-center text-sm shadow-none focus-visible:ring-0"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <Input
                                                            value={ex.reps}
                                                            onChange={(e) =>
                                                                updateExercise(
                                                                    i,
                                                                    'reps',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="-"
                                                            className="h-8 border-0 px-1 text-center text-sm shadow-none focus-visible:ring-0"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <Input
                                                            value={ex.expectedRpe}
                                                            onChange={(e) =>
                                                                updateExercise(
                                                                    i,
                                                                    'expectedRpe',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="-"
                                                            className="h-8 border-0 px-1 text-center text-sm shadow-none focus-visible:ring-0"
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <Input
                                                            value={ex.loadRange}
                                                            onChange={(e) =>
                                                                updateExercise(
                                                                    i,
                                                                    'loadRange',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="-"
                                                            className="h-8 border-0 px-1 text-center text-sm shadow-none focus-visible:ring-0"
                                                        />
                                                    </td>
                                                    <td className="p-1 text-center text-sm tabular-nums text-muted-foreground">
                                                        {ex.loadActual || '\u2014'}
                                                    </td>
                                                    <td className="p-1 text-center text-sm tabular-nums text-muted-foreground">
                                                        {ex.rpeActual ? `@${ex.rpeActual}` : '\u2014'}
                                                    </td>
                                                    <td className="p-2">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            onClick={() => removeExercise(i)}
                                                        >
                                                            <Trash2Icon className="size-3" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="px-3 py-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={addExercise}
                                        >
                                            <PlusIcon className="size-3.5" />
                                            Add exercise
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}

                        {selectedWeek && (
                            <>
                                {selectedWeek.userNotesForCoach && (
                                    <>
                                        <SectionLabel>Notes for Coach</SectionLabel>
                                        <div className="rounded-xl bg-secondary px-4 py-3">
                                            <p className="text-sm text-secondary-foreground whitespace-pre-wrap">
                                                {selectedWeek.userNotesForCoach}
                                            </p>
                                        </div>
                                    </>
                                )}

                                <SectionLabel>Coach Notes</SectionLabel>
                                <Textarea
                                    value={selectedWeek.coachNotesForUser}
                                    onChange={(e) =>
                                        setBlocks((prev) =>
                                            prev.map((b, bi) =>
                                                bi === selectedBlockIdx
                                                    ? {
                                                          ...b,
                                                          weeks: b.weeks.map((w, wi) =>
                                                              wi === selectedWeekIdx
                                                                  ? {
                                                                        ...w,
                                                                        coachNotesForUser:
                                                                            e.target.value,
                                                                    }
                                                                  : w,
                                                          ),
                                                      }
                                                    : b,
                                            ),
                                        )
                                    }
                                    placeholder={`Notes for Week ${selectedWeek.weekNumber}...`}
                                    className="min-h-24"
                                />
                            </>
                        )}
                    </>
                )}

                {error && <p className="text-sm text-destructive text-center">{error}</p>}

                <Button type="submit" disabled={saving} className="w-full" size="lg">
                    {saving ? 'Saving...' : program ? 'Save Changes' : 'Create Program'}
                </Button>
            </div>
        </form>
    )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {children}
        </p>
    )
}
