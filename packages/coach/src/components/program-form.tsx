'use client'

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { toast } from 'sonner'
import { GripVertical, PlusIcon, Trash2Icon } from 'lucide-react'
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
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import {
    createProgram,
    updateProgram,
    type DayData,
    type ExerciseData,
    type Program,
} from '@/lib/api'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ExerciseNameInput, useExerciseNames } from '@/components/exercise-name-input'

const FATIGUE_METRICS = [
    { key: 'sleep_quality', label: 'Sleep Quality' },
    { key: 'cognitive_capacity', label: 'Cognitive Capacity' },
    { key: 'general_motivation', label: 'General Motivation' },
    { key: 'motivation_to_train', label: 'Motivation to Train' },
    { key: 'sense_of_wellbeing', label: 'Sense of Wellbeing' },
    { key: 'perceived_stress', label: 'Perceived Stress' },
    { key: 'energy_levels', label: 'Energy Levels' },
    { key: 'libido', label: 'Libido' },
    { key: 'soreness', label: 'Soreness' },
]

const WEEKLY_CHECK_IN_METRICS = [
    { key: 'bodyweight', label: 'Bodyweight', unit: 'lbs' },
    { key: 'calories', label: 'Calories', unit: 'kcal' },
    { key: 'sleep_hours', label: 'Sleep', unit: 'hrs' },
]

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
    fatigueIndex: Record<string, number> | null
    weeklyCheckIn: Record<string, number> | null
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
        fatigueIndex: null,
        weeklyCheckIn: null,
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
                fatigueIndex: w.fatigueIndex as Record<string, number> | null,
                weeklyCheckIn: w.weeklyCheckIn as Record<string, number> | null,
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
                userNotesForCoach: w.userNotesForCoach || null,
                fatigueIndex: w.fatigueIndex,
                weeklyCheckIn: w.weeklyCheckIn,
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
                userNotesForCoach: w.userNotesForCoach || null,
                fatigueIndex: w.fatigueIndex,
                weeklyCheckIn: w.weeklyCheckIn,
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
                            loadActual: e.loadActual.trim() ? Number(e.loadActual) : null,
                            rpeActual: e.rpeActual.trim() ? Number(e.rpeActual) : null,
                            order: ei,
                        })),
                })),
            })),
        })),
    }
}

function clampIdx(idx: number, arr: { length: number }) {
    return Math.min(Math.max(0, idx), arr.length - 1)
}

export function ProgramForm({ userId, program }: { userId: string; program?: Program }) {
    const initial = program
        ? fromProgram(program)
        : { name: '', description: '', blocks: [emptyBlock(1)] }

    const [programId, setProgramId] = useState<string | undefined>(program?.id)
    const storageKey = programId ? `program_${programId}` : null
    const saved = storageKey
        ? (() => {
              try {
                  const raw = localStorage.getItem(storageKey)
                  if (raw) return JSON.parse(raw) as { b: number; w: number }
              } catch {
                  // ignore
              }
              return null
          })()
        : null

    const [name, setName] = useState(initial.name)
    const [description, setDescription] = useState(initial.description)
    const [blocks, setBlocks] = useState<BlockEntry[]>(initial.blocks)
    const [selectedBlockIdx, setSelectedBlockIdx] = useState(() =>
        saved ? clampIdx(saved.b, initial.blocks) : 0,
    )
    const [selectedWeekIdx, setSelectedWeekIdx] = useState(() => {
        if (!saved) return 0
        const block = initial.blocks[saved.b]
        return block ? clampIdx(saved.w, block.weeks) : 0
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [weekSelectKey, setWeekSelectKey] = useState(0)
    const exerciseNames = useExerciseNames()

    useEffect(() => {
        if (!storageKey) return
        try {
            localStorage.setItem(
                storageKey,
                JSON.stringify({ b: selectedBlockIdx, w: selectedWeekIdx }),
            )
        } catch {
            // ignore
        }
    }, [storageKey, selectedBlockIdx, selectedWeekIdx])

    const weekCountRef = useRef<number | null>(null)

    useLayoutEffect(() => {
        const block = blocks[selectedBlockIdx]
        const weekLen = block?.weeks.length ?? 0
        const prev = weekCountRef.current
        weekCountRef.current = weekLen
        if (prev != null && weekLen > prev) {
            setSelectedWeekIdx(weekLen - 1)
            setWeekSelectKey((k) => k + 1)
        }
    }, [blocks, selectedBlockIdx])

    const selectedBlock = blocks[selectedBlockIdx]
    const selectedWeek = selectedBlock?.weeks[selectedWeekIdx]

    const addBlock = useCallback(() => {
        setBlocks((prev) => [...prev, emptyBlock(prev.length + 1)])
        setSelectedBlockIdx(blocks.length)
        setSelectedWeekIdx(0)
    }, [blocks.length])

    const removeBlock = useCallback(
        (idx: number) => {
            if (blocks.length <= 1) return
            setBlocks((prev) => prev.filter((_, i) => i !== idx))
            if (selectedBlockIdx >= idx) {
                setSelectedBlockIdx(Math.max(0, selectedBlockIdx - 1))
                setSelectedWeekIdx(0)
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
                return newBlocks
            })
        },
        [selectedBlockIdx, selectedWeekIdx],
    )

    const addExercise = useCallback(
        (dayIdx: number) => {
            setBlocks((prev) => {
                const block = prev[selectedBlockIdx]
                if (!block) return prev
                const week = block.weeks[selectedWeekIdx]
                if (!week) return prev
                const day = week.days[dayIdx]
                if (!day) return prev
                const newBlocks = [...prev]
                const newWeeks = [...block.weeks]
                const newDays = [...week.days]
                newDays[dayIdx] = {
                    ...day,
                    exercises: [...day.exercises, emptyExercise()],
                }
                newWeeks[selectedWeekIdx] = { ...week, days: newDays }
                newBlocks[selectedBlockIdx] = { ...block, weeks: newWeeks }
                return newBlocks
            })
        },
        [selectedBlockIdx, selectedWeekIdx],
    )

    const removeExercise = useCallback(
        (dayIdx: number, exerciseIdx: number) => {
            setBlocks((prev) => {
                const block = prev[selectedBlockIdx]
                if (!block) return prev
                const week = block.weeks[selectedWeekIdx]
                if (!week) return prev
                const day = week.days[dayIdx]
                if (!day) return prev
                const newBlocks = [...prev]
                const newWeeks = [...block.weeks]
                const newDays = [...week.days]
                newDays[dayIdx] = {
                    ...day,
                    exercises: day.exercises.filter((_, i) => i !== exerciseIdx),
                }
                newWeeks[selectedWeekIdx] = { ...week, days: newDays }
                newBlocks[selectedBlockIdx] = { ...block, weeks: newWeeks }
                return newBlocks
            })
        },
        [selectedBlockIdx, selectedWeekIdx],
    )

    const moveExercise = useCallback(
        (dayIdx: number, fromIdx: number, toIdx: number) => {
            setBlocks((prev) => {
                const block = prev[selectedBlockIdx]
                if (!block) return prev
                const week = block.weeks[selectedWeekIdx]
                if (!week) return prev
                const day = week.days[dayIdx]
                if (!day) return prev
                const newBlocks = [...prev]
                const newWeeks = [...block.weeks]
                const newDays = [...week.days]
                newDays[dayIdx] = {
                    ...day,
                    exercises: arrayMove(day.exercises, fromIdx, toIdx),
                }
                newWeeks[selectedWeekIdx] = { ...week, days: newDays }
                newBlocks[selectedBlockIdx] = { ...block, weeks: newWeeks }
                return newBlocks
            })
        },
        [selectedBlockIdx, selectedWeekIdx],
    )

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    const updateExercise = useCallback(
        (dayIdx: number, exerciseIdx: number, field: keyof ExerciseEntry, value: string) => {
            setBlocks((prev) => {
                const block = prev[selectedBlockIdx]
                if (!block) return prev
                const week = block.weeks[selectedWeekIdx]
                if (!week) return prev
                const day = week.days[dayIdx]
                if (!day) return prev
                const newBlocks = [...prev]
                const newWeeks = [...block.weeks]
                const newDays = [...week.days]
                newDays[dayIdx] = {
                    ...day,
                    exercises: day.exercises.map((e, i) =>
                        i === exerciseIdx ? { ...e, [field]: value } : e,
                    ),
                }
                newWeeks[selectedWeekIdx] = { ...week, days: newDays }
                newBlocks[selectedBlockIdx] = { ...block, weeks: newWeeks }
                return newBlocks
            })
        },
        [selectedBlockIdx, selectedWeekIdx],
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
            if (programId) {
                await updateProgram(programId, toUpdatePayload(name.trim(), description, blocks))
                toast.success('Program Saved')
            } else {
                const created = await createProgram(
                    toCreatePayload(userId, name.trim(), description, blocks),
                )
                const populated = fromProgram(created)
                setBlocks(populated.blocks)
                setProgramId(created.id)
            }
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

                        <SectionLabel>Schedule</SectionLabel>
                        <div className="flex gap-2 items-center">
                            <Select
                                key={weekSelectKey}
                                value={String(selectedWeekIdx)}
                                onValueChange={(v) => setSelectedWeekIdx(Number(v))}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue>
                                        {selectedWeek ? `Week ${selectedWeek.weekNumber}` : 'Week'}
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
                            <>
                                <div className="space-y-6">
                                    {selectedWeek.days.map((day, dayIdx) => (
                                        <div key={day._key} className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-base font-semibold">
                                                    Day {day.dayNumber}
                                                </h3>
                                                {selectedWeek.days.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon-xs"
                                                        onClick={() => removeDay(dayIdx)}
                                                    >
                                                        <Trash2Icon className="size-3.5" />
                                                    </Button>
                                                )}
                                            </div>

                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={(event: DragEndEvent) => {
                                                    const { active, over } = event
                                                    if (!over || active.id === over.id) return
                                                    const exercises = day.exercises
                                                    const oldIndex = exercises.findIndex(
                                                        (e) => e._key === active.id,
                                                    )
                                                    const newIndex = exercises.findIndex(
                                                        (e) => e._key === over.id,
                                                    )
                                                    if (oldIndex === -1 || newIndex === -1) return
                                                    moveExercise(dayIdx, oldIndex, newIndex)
                                                }}
                                            >
                                                <div className="rounded-xl border border-border overflow-hidden">
                                                    <table className="w-full caption-bottom text-sm">
                                                        <thead>
                                                            <tr className="border-b border-border">
                                                                <th className="h-9 w-8" />
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
                                                                    RPE
                                                                </th>
                                                                <th className="h-9 w-10" />
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <SortableContext
                                                                items={day.exercises.map(
                                                                    (e) => e._key,
                                                                )}
                                                                strategy={
                                                                    verticalListSortingStrategy
                                                                }
                                                            >
                                                                {day.exercises.map((ex, i) => (
                                                                    <SortableExerciseRow
                                                                        key={ex._key}
                                                                        ex={ex}
                                                                        index={i}
                                                                        exercisesLength={
                                                                            day.exercises.length
                                                                        }
                                                                        updateExercise={(
                                                                            idx,
                                                                            field,
                                                                            value,
                                                                        ) =>
                                                                            updateExercise(
                                                                                dayIdx,
                                                                                idx,
                                                                                field,
                                                                                value,
                                                                            )
                                                                        }
                                                                        removeExercise={(idx) =>
                                                                            removeExercise(
                                                                                dayIdx,
                                                                                idx,
                                                                            )
                                                                        }
                                                                        exerciseNames={
                                                                            exerciseNames
                                                                        }
                                                                    />
                                                                ))}
                                                            </SortableContext>
                                                        </tbody>
                                                    </table>
                                                    <div className="px-3 py-2">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => addExercise(dayIdx)}
                                                        >
                                                            <PlusIcon className="size-3.5" />
                                                            Add exercise
                                                        </Button>
                                                    </div>
                                                </div>
                                            </DndContext>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={addDay}
                                    >
                                        <PlusIcon className="size-3.5" />
                                        Add Day
                                    </Button>
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

                        {selectedBlock.weeks.length > 0 && (
                            <>
                                <SectionLabel>Fatigue Index</SectionLabel>
                                <Accordion
                                    type="single"
                                    collapsible
                                    className="rounded-xl border border-border"
                                >
                                    {selectedBlock.weeks.map((week) => {
                                        const fi = week.fatigueIndex
                                        const hasData = fi != null
                                        const percentage = hasData
                                            ? (() => {
                                                  const sum = Object.values(fi).reduce(
                                                      (a, b) => a + b,
                                                      0,
                                                  )
                                                  const raw = Math.round((sum / 245) * 1000) / 1000
                                                  const pct =
                                                      isNaN(raw) || !isFinite(raw)
                                                          ? 0
                                                          : Math.round(raw * 100 * 10) / 10
                                                  return pct
                                              })()
                                            : null

                                        return (
                                            <AccordionItem key={week._key} value={week._key}>
                                                <AccordionTrigger className="px-4 hover:no-underline">
                                                    <div className="flex flex-1 items-center justify-between gap-4">
                                                        <span className="font-medium">
                                                            Week {week.weekNumber}
                                                        </span>
                                                        {hasData ? (
                                                            <span className="text-sm tabular-nums text-muted-foreground">
                                                                {percentage}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground/50">
                                                                No data
                                                            </span>
                                                        )}
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="px-4">
                                                    {hasData ? (
                                                        <div className="grid grid-cols-3 gap-x-4 gap-y-2 pt-1">
                                                            {FATIGUE_METRICS.map(
                                                                ({ key, label }) => (
                                                                    <div
                                                                        key={key}
                                                                        className="flex items-center justify-between rounded-md bg-secondary px-3 py-2"
                                                                    >
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {label}
                                                                        </span>
                                                                        <span className="ml-2 text-sm font-medium tabular-nums">
                                                                            {fi[key]}
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">
                                                            Athlete has not submitted fatigue data
                                                            for this week.
                                                        </p>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                        )
                                    })}
                                </Accordion>
                            </>
                        )}

                        {selectedBlock.weeks.length > 0 && (
                            <>
                                <SectionLabel>Weekly Check-In</SectionLabel>
                                <Accordion
                                    type="single"
                                    collapsible
                                    className="rounded-xl border border-border"
                                >
                                    {selectedBlock.weeks.map((week) => {
                                        const wci = week.weeklyCheckIn
                                        const hasWci = wci != null
                                        return (
                                            <AccordionItem
                                                key={`wci-${week._key}`}
                                                value={`wci-${week._key}`}
                                            >
                                                <AccordionTrigger className="px-4 hover:no-underline">
                                                    <div className="flex flex-1 items-center justify-between gap-4">
                                                        <span className="font-medium">
                                                            Week {week.weekNumber}
                                                        </span>
                                                        {hasWci ? (
                                                            <span className="text-sm text-muted-foreground">
                                                                {wci.bodyweight}{' '}
                                                                {
                                                                    WEEKLY_CHECK_IN_METRICS.find(
                                                                        (metric) =>
                                                                            metric.key ===
                                                                            'bodyweight',
                                                                    )?.unit
                                                                }
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground/50">
                                                                No data
                                                            </span>
                                                        )}
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="px-4">
                                                    {hasWci ? (
                                                        <div className="grid grid-cols-3 gap-x-4 gap-y-2 pt-1">
                                                            {WEEKLY_CHECK_IN_METRICS.map(
                                                                ({ key, label, unit }) => (
                                                                    <div
                                                                        key={key}
                                                                        className="flex items-center justify-between rounded-md bg-secondary px-3 py-2"
                                                                    >
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {label}
                                                                        </span>
                                                                        <span className="ml-2 text-sm font-medium tabular-nums">
                                                                            {wci[key]} {unit}
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">
                                                            Athlete has not submitted a weekly
                                                            check-in for this week.
                                                        </p>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                        )
                                    })}
                                </Accordion>
                            </>
                        )}
                    </>
                )}

                {error && <p className="text-sm text-destructive text-center">{error}</p>}

                <Button type="submit" disabled={saving} className="w-full" size="lg">
                    {saving ? 'Saving...' : programId ? 'Save Changes' : 'Create Program'}
                </Button>
            </div>
        </form>
    )
}

function SortableExerciseRow({
    ex,
    index,
    exercisesLength,
    updateExercise,
    removeExercise,
    exerciseNames,
}: {
    ex: ExerciseEntry
    index: number
    exercisesLength: number
    updateExercise: (idx: number, field: keyof ExerciseEntry, value: string) => void
    removeExercise: (idx: number) => void
    exerciseNames: string[]
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: ex._key,
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={cn(
                index < exercisesLength - 1 ? 'border-b border-border' : '',
                isDragging && 'relative z-10 bg-accent rounded-md',
            )}
        >
            <td className="p-0">
                <button
                    type="button"
                    className="flex size-8 items-center justify-center cursor-grab active:cursor-grabbing rounded"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="size-3.5 text-muted-foreground" />
                </button>
            </td>
            <td className="p-2">
                <ExerciseNameInput
                    value={ex.name}
                    onChange={(v) => updateExercise(index, 'name', v)}
                    suggestions={exerciseNames}
                />
            </td>
            <td className="p-2">
                <Input
                    value={ex.sets}
                    onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                    placeholder="-"
                    className="h-8 border-0 px-1 text-center text-sm shadow-none focus-visible:ring-0"
                />
            </td>
            <td className="p-2">
                <Input
                    value={ex.reps}
                    onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                    placeholder="-"
                    className="h-8 border-0 px-1 text-center text-sm shadow-none focus-visible:ring-0"
                />
            </td>
            <td className="p-2">
                <Input
                    value={ex.expectedRpe}
                    onChange={(e) => updateExercise(index, 'expectedRpe', e.target.value)}
                    placeholder="-"
                    className="h-8 border-0 px-1 text-center text-sm shadow-none focus-visible:ring-0"
                />
            </td>
            <td className="p-2">
                <Input
                    value={ex.loadRange}
                    onChange={(e) => updateExercise(index, 'loadRange', e.target.value)}
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
                    onClick={() => removeExercise(index)}
                >
                    <Trash2Icon className="size-3" />
                </Button>
            </td>
        </tr>
    )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {children}
        </p>
    )
}
