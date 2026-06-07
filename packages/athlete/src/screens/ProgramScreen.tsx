import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { captureRef } from 'react-native-view-shot'

import { ShareSheet } from '../components/ShareSheet'
import { useToast } from '../hooks/use-toast'

import { apiGet, apiPatch, type ExerciseData, type ProgramData } from '../lib/api'
import { getStoredToken } from '../lib/auth'
import { useProgramStore } from '../stores/programStore'
import { useActiveTheme } from '../stores/themeStore'
import type { HomeStackParamList } from './types'

type Props = NativeStackScreenProps<HomeStackParamList, 'Program'>

export default function ProgramScreen({ navigation, route }: Props) {
    const { programId } = route.params
    const theme = useActiveTheme()
    const c = theme.colors
    const [program, setProgram] = useState<ProgramData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const selectedBlockId = useProgramStore((s) => s.selectedBlockId[programId])
    const selectedWeekId = useProgramStore((s) => s.selectedWeekId[programId])
    const selectedDayId = useProgramStore((s) => s.selectedDayId[programId])
    const selectBlock = useProgramStore((s) => s.selectBlock)
    const selectWeek = useProgramStore((s) => s.selectWeek)
    const selectDay = useProgramStore((s) => s.selectDay)
    const [openDropdown, setOpenDropdown] = useState<'week' | 'day' | null>(null)
    const [shareVisible, setShareVisible] = useState(false)
    const [capturedUri, setCapturedUri] = useState<string | null>(null)
    const { showToast } = useToast()
    const tableRef = useRef<View>(null)
    const blockScrollRef = useRef<ScrollView>(null)
    const blockLayouts = useRef<Record<string, { x: number; width: number }>>({})
    const blockScrollWidth = useRef(0)
    const hasScrolledToBlock = useRef(false)

    const handleCapture = useCallback(async () => {
        if (!tableRef.current) return
        try {
            const uri = await captureRef(tableRef.current, {
                format: 'png',
                quality: 1,
            })
            setCapturedUri(uri)
            setShareVisible(true)
        } catch {
            // silently fail
        }
    }, [])

    useFocusEffect(
        useCallback(() => {
            let cancelled = false
            ;(async () => {
                try {
                    const token = await getStoredToken()
                    if (!token || cancelled) return
                    const data = await apiGet(`/api/programs/${programId}`, token)
                    if (!cancelled) {
                        setProgram(data as ProgramData)
                    }
                } finally {
                    if (!cancelled) setIsLoading(false)
                }
            })()
            return () => {
                cancelled = true
            }
        }, [programId]),
    )

    useEffect(() => {
        if (!selectedBlockId || !program || hasScrolledToBlock.current) return
        const blockExists = program.blocks.some((b) => b.id === selectedBlockId)
        const blockId = blockExists ? selectedBlockId : program.blocks[0]?.id
        if (!blockId) return
        const layout = blockLayouts.current[blockId]
        if (!layout || !blockScrollWidth.current) return
        if (layout.x + layout.width > blockScrollWidth.current || layout.x < 0) {
            const scrollX = Math.max(0, layout.x - (blockScrollWidth.current - layout.width) / 2)
            blockScrollRef.current?.scrollTo({ x: scrollX, animated: false })
        }
        hasScrolledToBlock.current = true
    }, [selectedBlockId, program])

    if (isLoading || !program) {
        return (
            <SafeAreaView
                className="flex-1 items-center justify-center"
                style={{ backgroundColor: c.surface }}
            >
                <ActivityIndicator size="large" color={c.accent} />
            </SafeAreaView>
        )
    }

    const activeBlockId =
        selectedBlockId && program.blocks.some((b) => b.id === selectedBlockId)
            ? selectedBlockId
            : (program.blocks[0]?.id ?? null)

    const activeBlock = program.blocks.find((b) => b.id === activeBlockId)

    const activeWeekId =
        activeBlock && selectedWeekId && activeBlock.weeks.some((w) => w.id === selectedWeekId)
            ? selectedWeekId
            : (activeBlock?.weeks[0]?.id ?? null)

    const activeWeek = activeBlock?.weeks.find((w) => w.id === activeWeekId)

    const activeDayId =
        activeWeek && selectedDayId && activeWeek.days.some((d) => d.id === selectedDayId)
            ? selectedDayId
            : (activeWeek?.days[0]?.id ?? null)

    const activeDay = activeWeek?.days.find((d) => d.id === activeDayId)
    const exercises = activeDay?.exercises ?? []

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: c.surface }}>
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="px-6 pt-4 pb-2">
                    <Pressable
                        onPress={() => navigation.goBack()}
                        className="w-8 h-8 items-center justify-center -ml-2 active:opacity-80"
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <Ionicons name="chevron-back" size={24} color={c.accent} />
                    </Pressable>
                </View>

                <View className="px-6 mb-6">
                    <Text
                        className="text-[30px] font-bold tracking-tight"
                        style={{ color: c.label }}
                    >
                        {program.name}
                    </Text>
                    {program.description ? (
                        <Text
                            className="text-[15px] mt-2 leading-[22px]"
                            style={{ color: c.labelSecondary }}
                        >
                            {program.description}
                        </Text>
                    ) : null}
                </View>

                {program.blocks.length > 0 && (
                    <View className="mb-6">
                        <Text
                            className="text-[11px] font-semibold uppercase tracking-wide px-6 mb-3"
                            style={{ color: c.labelTertiary }}
                        >
                            Block
                        </Text>
                        <ScrollView
                            ref={blockScrollRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            onLayout={(e) => {
                                blockScrollWidth.current = e.nativeEvent.layout.width
                            }}
                            contentContainerStyle={{
                                paddingHorizontal: 24,
                                gap: 8,
                            }}
                        >
                            {program.blocks.map((block) => {
                                const isActive = block.id === activeBlockId

                                return (
                                    <Pressable
                                        key={block.id}
                                        onLayout={(e) => {
                                            blockLayouts.current[block.id] = {
                                                x: e.nativeEvent.layout.x,
                                                width: e.nativeEvent.layout.width,
                                            }
                                        }}
                                        onPress={() => {
                                            selectBlock(programId, block.id)
                                            const firstWeek = block.weeks[0]
                                            if (firstWeek) {
                                                selectWeek(programId, firstWeek.id)
                                                const firstDay = firstWeek.days[0]
                                                if (firstDay) {
                                                    selectDay(programId, firstDay.id)
                                                }
                                            }
                                        }}
                                        className="rounded-xl px-4 py-[8px] active:opacity-80"
                                        style={{
                                            backgroundColor: isActive
                                                ? c.accent
                                                : c.surfaceSecondary,
                                        }}
                                        accessibilityRole="button"
                                        accessibilityLabel={`${block.name} block`}
                                        accessibilityState={{ selected: isActive }}
                                    >
                                        <Text
                                            className="text-[13px] font-semibold"
                                            style={{
                                                color: isActive ? c.label : c.labelSecondary,
                                            }}
                                        >
                                            {block.name}
                                        </Text>
                                    </Pressable>
                                )
                            })}
                        </ScrollView>

                        <View className="px-6 mt-5">
                            <Text
                                className="text-[11px] font-semibold uppercase tracking-wide mb-3"
                                style={{ color: c.labelTertiary }}
                            >
                                Week & Day
                            </Text>
                            <View className="flex-row" style={{ gap: 10 }}>
                                <View
                                    className="flex-1 relative"
                                    style={{ zIndex: openDropdown === 'week' ? 20 : 1 }}
                                >
                                    <DropdownTrigger
                                        label={
                                            activeWeek ? `Week ${activeWeek.weekNumber}` : 'Week'
                                        }
                                        isOpen={openDropdown === 'week'}
                                        onPress={() =>
                                            setOpenDropdown(openDropdown === 'week' ? null : 'week')
                                        }
                                        accessibilityLabel="Select week"
                                    />
                                    {openDropdown === 'week' && activeBlock && (
                                        <DropdownList>
                                            {activeBlock.weeks.map((week, i) => (
                                                <DropdownItem
                                                    key={week.id}
                                                    label={`Week ${week.weekNumber}`}
                                                    isActive={week.id === activeWeekId}
                                                    isLast={i === activeBlock.weeks.length - 1}
                                                    onPress={() => {
                                                        selectWeek(programId, week.id)
                                                        const firstDay = week.days[0]
                                                        if (firstDay) {
                                                            selectDay(programId, firstDay.id)
                                                        }
                                                        setOpenDropdown(null)
                                                    }}
                                                />
                                            ))}
                                        </DropdownList>
                                    )}
                                </View>

                                <View
                                    className="flex-1 relative"
                                    style={{ zIndex: openDropdown === 'day' ? 20 : 1 }}
                                >
                                    <DropdownTrigger
                                        label={activeDay ? `Day ${activeDay.dayNumber}` : 'Day'}
                                        isOpen={openDropdown === 'day'}
                                        onPress={() =>
                                            setOpenDropdown(openDropdown === 'day' ? null : 'day')
                                        }
                                        accessibilityLabel="Select day"
                                    />
                                    {openDropdown === 'day' && activeWeek && (
                                        <DropdownList>
                                            {activeWeek.days.map((day, i) => (
                                                <DropdownItem
                                                    key={day.id}
                                                    label={`Day ${day.dayNumber}`}
                                                    isActive={day.id === activeDayId}
                                                    isLast={i === activeWeek.days.length - 1}
                                                    onPress={() => {
                                                        selectDay(programId, day.id)
                                                        setOpenDropdown(null)
                                                    }}
                                                />
                                            ))}
                                        </DropdownList>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {exercises.length > 0 && (
                    <View className="mb-6">
                        <Text
                            className="text-[11px] font-semibold uppercase tracking-wide px-6 mb-3"
                            style={{ color: c.labelTertiary }}
                        >
                            Exercises
                        </Text>
                        <ExerciseTable
                            exercises={exercises}
                            captureRef={tableRef}
                            onLongPress={handleCapture}
                        />
                    </View>
                )}

                {activeWeek && (
                    <View className="px-6" style={{ gap: 14 }}>
                        <Text
                            className="text-[11px] font-semibold uppercase tracking-wide"
                            style={{ color: c.labelTertiary }}
                        >
                            Metrics
                        </Text>
                        <NotesField
                            label="Notes for Coach"
                            value={activeWeek.userNotesForCoach}
                            editable
                            weekId={activeWeek.id}
                        />
                        {activeWeek.coachNotesForUser != null && (
                            <NotesField label="Coach Notes" value={activeWeek.coachNotesForUser} />
                        )}
                        <View className="flex-row" style={{ gap: 10 }}>
                            <View className="flex-1">
                                <Pressable
                                    onPress={() =>
                                        navigation.navigate('Fatigue', {
                                            weekId: activeWeek.id,
                                            existing: activeWeek.fatigueIndex,
                                        })
                                    }
                                    className="rounded-xl px-4 py-3.5 flex-row items-center justify-between active:opacity-80"
                                    style={{ backgroundColor: c.surfaceSecondary }}
                                    accessibilityRole="button"
                                    accessibilityLabel="Fatigue Index"
                                >
                                    <View className="flex-row items-center" style={{ gap: 6 }}>
                                        <Ionicons
                                            name="speedometer-outline"
                                            size={16}
                                            color={c.labelSecondary}
                                        />
                                        <Text
                                            className="text-[14px] font-medium"
                                            style={{ color: c.label }}
                                        >
                                            Fatigue Index
                                        </Text>
                                    </View>
                                    <Ionicons
                                        name="chevron-forward"
                                        size={14}
                                        color={c.labelTertiary}
                                    />
                                </Pressable>
                            </View>
                            <View className="flex-1">
                                <Pressable
                                    onPress={() =>
                                        navigation.navigate('Checkin', {
                                            weekId: activeWeek.id,
                                            existing: activeWeek.weeklyCheckIn,
                                        })
                                    }
                                    className="rounded-xl px-4 py-3.5 flex-row items-center justify-between active:opacity-80"
                                    style={{ backgroundColor: c.surfaceSecondary }}
                                    accessibilityRole="button"
                                    accessibilityLabel="Weekly Check-In"
                                >
                                    <View className="flex-row items-center" style={{ gap: 6 }}>
                                        <Ionicons
                                            name="scale-outline"
                                            size={16}
                                            color={c.labelSecondary}
                                        />
                                        <Text
                                            className="text-[14px] font-medium"
                                            style={{ color: c.label }}
                                        >
                                            Check-In
                                        </Text>
                                    </View>
                                    <Ionicons
                                        name="chevron-forward"
                                        size={14}
                                        color={c.labelTertiary}
                                    />
                                </Pressable>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
            <ShareSheet
                visible={shareVisible}
                imageUri={capturedUri}
                onClose={() => {
                    setShareVisible(false)
                    setCapturedUri(null)
                }}
                onSaved={() => {
                    setShareVisible(false)
                    setCapturedUri(null)
                    showToast('Saved to Photos')
                }}
            />
        </SafeAreaView>
    )
}

function ExerciseTable({
    exercises,
    captureRef,
    onLongPress,
}: {
    exercises: ExerciseData[]
    captureRef?: React.RefObject<View | null>
    onLongPress?: () => void
}) {
    const c = useActiveTheme().colors

    return (
        <View className="px-6">
            <Pressable onLongPress={onLongPress}>
                <View
                    ref={captureRef}
                    className="rounded-xl overflow-hidden"
                    style={{ backgroundColor: c.surfaceSecondary }}
                >
                    <View
                        className="flex-row items-center px-4 py-3"
                        style={{ borderBottomWidth: 1, borderColor: c.border }}
                    >
                        <TableHeader label="Exercise" className="flex-1" />
                        <TableHeader label="Sets" className="w-[48px] text-center" />
                        <TableHeader label="RPE" className="w-[36px] text-center" />
                        <TableHeader label="Load" className="w-[52px] text-center mr-2" />
                        <TableHeader label="Actual" className="w-[48px] text-center" />
                        <TableHeader label="RPE" className="w-[42px] text-center ml-2" />
                    </View>

                    {exercises.map((exercise, i) => (
                        <ExerciseRow
                            key={exercise.id}
                            exercise={exercise}
                            isLast={i === exercises.length - 1}
                        />
                    ))}
                </View>
            </Pressable>
        </View>
    )
}

function TableHeader({ label, className }: { label: string; className: string }) {
    const c = useActiveTheme().colors

    return (
        <Text
            className={`text-[9px] font-semibold uppercase tracking-wide ${className}`}
            style={{ color: c.labelTertiary }}
        >
            {label}
        </Text>
    )
}

function ExerciseRow({ exercise, isLast }: { exercise: ExerciseData; isLast: boolean }) {
    const c = useActiveTheme().colors

    const saveExercise = useCallback(
        async (field: 'loadActual' | 'rpeActual', value: string) => {
            const num = value.trim() ? Number(value) : null
            if (num != null && isNaN(num)) return
            try {
                const token = await getStoredToken()
                if (!token) return
                await apiPatch(`/api/exercises/${exercise.id}`, { [field]: num }, token)
            } catch {
                // silently fail
            }
        },
        [exercise.id],
    )

    return (
        <View
            className="flex-row items-center px-4 py-3"
            style={isLast ? undefined : { borderBottomWidth: 1, borderColor: c.border }}
        >
            <Text className="text-[13px] font-medium flex-1" style={{ color: c.label }}>
                {exercise.name}
            </Text>
            <Text className="text-[13px] w-[48px] text-center" style={{ color: c.labelSecondary }}>
                {exercise.sets}×{exercise.reps}
            </Text>
            <Text className="text-[13px] w-[36px] text-center" style={{ color: c.labelSecondary }}>
                {exercise.expectedRpe != null ? `@${exercise.expectedRpe}` : '—'}
            </Text>
            <Text
                className="text-[13px] w-[52px] text-center mr-2"
                style={{ color: c.labelSecondary }}
            >
                {exercise.loadRange ?? '—'}
            </Text>
            <TextInput
                className="text-[13px] rounded-lg w-[48px] text-center py-1.5"
                style={{ color: c.label, backgroundColor: c.surfaceTertiary }}
                placeholder="—"
                placeholderTextColor={c.labelTertiary}
                keyboardType="numeric"
                cursorColor={c.accent}
                selectionColor={c.accent}
                defaultValue={exercise.loadActual != null ? String(exercise.loadActual) : ''}
                onEndEditing={(e) => saveExercise('loadActual', e.nativeEvent.text)}
            />
            <TextInput
                className="text-[13px] rounded-lg w-[42px] text-center py-1.5 ml-2"
                style={{ color: c.label, backgroundColor: c.surfaceTertiary }}
                placeholder="—"
                placeholderTextColor={c.labelTertiary}
                keyboardType="numeric"
                cursorColor={c.accent}
                selectionColor={c.accent}
                defaultValue={exercise.rpeActual != null ? String(exercise.rpeActual) : ''}
                onEndEditing={(e) => saveExercise('rpeActual', e.nativeEvent.text)}
            />
        </View>
    )
}

function NotesField({
    label,
    value,
    editable,
    weekId,
}: {
    label: string
    value: string | null
    editable?: boolean
    weekId?: string
}) {
    const c = useActiveTheme().colors
    const [text, setText] = useState(value ?? '')
    const [saving, setSaving] = useState(false)
    const { showToast } = useToast()

    const handleSave = useCallback(async () => {
        if (!weekId) return
        setSaving(true)
        try {
            const token = await getStoredToken()
            if (!token) return
            await apiPatch(
                `/api/weeks/${weekId}`,
                { userNotesForCoach: text.trim() || null },
                token,
            )
        } finally {
            showToast('Saved')
            setSaving(false)
        }
    }, [weekId, text])

    return (
        <View className="rounded-xl px-4 py-3" style={{ backgroundColor: c.surfaceSecondary }}>
            <Text
                className="text-[11px] font-semibold uppercase tracking-wide mb-2"
                style={{ color: c.labelTertiary }}
            >
                {label}
            </Text>

            {editable ? (
                <View>
                    <TextInput
                        className="text-[15px] leading-[22px]"
                        style={{ color: c.label }}
                        placeholder="Write a note..."
                        placeholderTextColor={c.labelTertiary}
                        multiline
                        textAlignVertical="top"
                        cursorColor={c.accent}
                        selectionColor={c.accent}
                        value={text}
                        onChangeText={setText}
                    />
                    <View className="flex-row justify-end mt-3">
                        <Pressable
                            onPress={handleSave}
                            disabled={saving}
                            className="rounded-lg px-4 py-1.5 active:opacity-80"
                            accessibilityRole="button"
                            accessibilityLabel="Save note"
                        >
                            <Text className="text-[13px] font-semibold" style={{ color: c.accent }}>
                                {saving ? 'Saving...' : 'Save'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            ) : (
                <Text className="text-[15px] leading-[22px]" style={{ color: c.labelSecondary }}>
                    {value ?? ''}
                </Text>
            )}
        </View>
    )
}

function DropdownTrigger({
    label,
    isOpen,
    onPress,
    accessibilityLabel,
}: {
    label: string
    isOpen: boolean
    onPress: () => void
    accessibilityLabel: string
}) {
    const c = useActiveTheme().colors

    return (
        <Pressable
            onPress={onPress}
            className="rounded-xl px-4 py-3.5 flex-row items-center justify-between active:opacity-80"
            style={{ backgroundColor: c.surfaceSecondary }}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ expanded: isOpen }}
        >
            <Text className="text-[14px] font-medium" numberOfLines={1} style={{ color: c.label }}>
                {label}
            </Text>
            <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={15}
                color={c.labelTertiary}
                style={{ marginLeft: 6 }}
            />
        </Pressable>
    )
}

function DropdownList({ children }: { children: React.ReactNode }) {
    const c = useActiveTheme().colors

    return (
        <View
            className="absolute left-0 right-0 mt-2 rounded-xl overflow-hidden"
            style={{ top: '100%', zIndex: 20, backgroundColor: c.surfaceSecondary }}
        >
            {children}
        </View>
    )
}

function DropdownItem({
    label,
    isActive,
    isLast,
    onPress,
}: {
    label: string
    isActive: boolean
    isLast: boolean
    onPress: () => void
}) {
    const c = useActiveTheme().colors

    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center justify-between px-4 py-3 active:opacity-80"
            style={isLast ? undefined : { borderBottomWidth: 1, borderColor: c.border }}
            accessibilityRole="button"
            accessibilityLabel={label}
        >
            <Text
                className="text-[15px]"
                style={{
                    color: isActive ? c.accent : c.label,
                    fontWeight: isActive ? '500' : '400',
                }}
            >
                {label}
            </Text>
            {isActive && <Ionicons name="checkmark" size={18} color={c.accent} />}
        </Pressable>
    )
}
