import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { apiGet, apiPatch, type ExerciseData, type ProgramData } from '../lib/api'
import { getStoredToken } from '../lib/auth'
import { useProgramStore } from '../stores/programStore'
import type { HomeStackParamList } from './types'

type Props = NativeStackScreenProps<HomeStackParamList, 'Program'>

export default function ProgramScreen({ navigation, route }: Props) {
    const { programId } = route.params
    const [program, setProgram] = useState<ProgramData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const selectedBlockId = useProgramStore((s) => s.selectedBlockId[programId])
    const selectedWeekId = useProgramStore((s) => s.selectedWeekId[programId])
    const selectedDayId = useProgramStore((s) => s.selectedDayId[programId])
    const selectBlock = useProgramStore((s) => s.selectBlock)
    const selectWeek = useProgramStore((s) => s.selectWeek)
    const selectDay = useProgramStore((s) => s.selectDay)
    const [openDropdown, setOpenDropdown] = useState<'week' | 'day' | null>(null)

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

    if (isLoading || !program) {
        return (
            <SafeAreaView className="flex-1 bg-surface items-center justify-center">
                <ActivityIndicator size="large" color="#0A84FF" />
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
        <SafeAreaView className="flex-1 bg-surface">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
                keyboardShouldPersistTaps="handled"
            >
                <View className="px-6">
                    <View className="flex-row items-center pt-2 pb-4">
                        <Pressable
                            onPress={() => navigation.goBack()}
                            className="w-8 h-8 items-center justify-center active:opacity-80"
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                        >
                            <Ionicons name="chevron-back" size={24} color="#0A84FF" />
                        </Pressable>
                    </View>

                    <Text className="text-label text-[28px] font-bold tracking-tight">
                        {program.name}
                    </Text>
                    {program.description ? (
                        <Text className="text-label-secondary text-[15px] mt-1.5 leading-[22px]">
                            {program.description}
                        </Text>
                    ) : null}
                </View>

                {program.blocks.length > 0 && (
                    <View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="mt-6"
                            contentContainerStyle={{
                                paddingHorizontal: 24,
                                gap: 6,
                            }}
                        >
                            {program.blocks.map((block) => {
                                const isActive = block.id === activeBlockId

                                return (
                                    <Pressable
                                        key={block.id}
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
                                        className={`rounded-xl px-3.5 py-[7px] active:opacity-80 ${
                                            isActive ? 'bg-label' : 'bg-surface-secondary'
                                        }`}
                                        accessibilityRole="button"
                                        accessibilityLabel={`${block.name} block`}
                                        accessibilityState={{ selected: isActive }}
                                    >
                                        <Text
                                            className={`text-[13px] font-medium ${
                                                isActive ? 'text-surface' : 'text-label-secondary'
                                            }`}
                                        >
                                            {block.name}
                                        </Text>
                                    </Pressable>
                                )
                            })}
                        </ScrollView>

                        <View className="mx-6 mt-4 flex-row" style={{ gap: 8 }}>
                            <View
                                className="flex-1 relative"
                                style={{ zIndex: openDropdown === 'week' ? 20 : 1 }}
                            >
                                <DropdownTrigger
                                    label={activeWeek ? `Week ${activeWeek.weekNumber}` : 'Week'}
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
                )}

                {exercises.length > 0 && <ExerciseTable exercises={exercises} />}

                {activeWeek && (
                    <View className="mx-6 mt-6" style={{ gap: 12 }}>
                        <NotesField
                            label="Notes for Coach"
                            value={activeWeek.userNotesForCoach}
                            editable
                            weekId={activeWeek.id}
                        />
                        {activeWeek.coachNotesForUser != null && (
                            <NotesField label="Coach Notes" value={activeWeek.coachNotesForUser} />
                        )}
                        <View className="flex-row" style={{ gap: 12 }}>
                            <View className="flex-1">
                                <Pressable
                                    onPress={() =>
                                        navigation.navigate('Fatigue', {
                                            weekId: activeWeek.id,
                                            existing: activeWeek.fatigueIndex,
                                        })
                                    }
                                    className="bg-surface-secondary rounded-xl px-4 py-3 flex-row items-center justify-between active:opacity-80"
                                    accessibilityRole="button"
                                    accessibilityLabel="Fatigue Index"
                                >
                                    <Text className="text-label text-[13px] font-medium">
                                        Fatigue Index
                                    </Text>
                                    <Ionicons name="chevron-forward" size={14} color="#8E8E93" />
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
                                    className="bg-surface-secondary rounded-xl px-4 py-3 flex-row items-center justify-between active:opacity-80"
                                    accessibilityRole="button"
                                    accessibilityLabel="Weekly Check-In"
                                >
                                    <Text className="text-label text-[13px] font-medium">
                                        Check-In
                                    </Text>
                                    <Ionicons name="chevron-forward" size={14} color="#8E8E93" />
                                </Pressable>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

function ExerciseTable({ exercises }: { exercises: ExerciseData[] }) {
    return (
        <View className="mt-6">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24 }}
            >
                <View>
                    <View className="bg-surface-secondary rounded-xl overflow-hidden">
                        <View className="flex-row items-center px-4 py-3 border-b border-[#38383A]">
                            <TableHeader label="Exercise" className="w-[140px]" />
                            <TableHeader label="Sets" className="w-[80px] text-center" />
                            <TableHeader label="RPE" className="w-[52px] text-center" />
                            <TableHeader label="Load" className="w-[68px] text-center mr-4" />
                            <TableHeader label="Actual" className="w-[64px] text-center" />
                            <TableHeader label="RPE" className="w-[52px] text-center ml-3" />
                        </View>

                        {exercises.map((exercise, i) => (
                            <ExerciseRow
                                key={exercise.id}
                                exercise={exercise}
                                isLast={i === exercises.length - 1}
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    )
}

function TableHeader({ label, className }: { label: string; className: string }) {
    return (
        <Text
            className={`text-label-tertiary text-[11px] font-semibold uppercase tracking-wide ${className}`}
        >
            {label}
        </Text>
    )
}

function ExerciseRow({ exercise, isLast }: { exercise: ExerciseData; isLast: boolean }) {
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
            className={`flex-row items-center px-4 py-3 ${
                isLast ? '' : 'border-b border-[#38383A]'
            }`}
        >
            <Text className="text-label text-[15px] font-medium w-[140px]" numberOfLines={1}>
                {exercise.name}
            </Text>
            <Text className="text-label-secondary text-[15px] w-[80px] text-center">
                {exercise.sets}×{exercise.reps}
            </Text>
            <Text className="text-label-secondary text-[15px] w-[52px] text-center">
                {exercise.expectedRpe != null ? `@${exercise.expectedRpe}` : '—'}
            </Text>
            <Text className="text-label-secondary text-[15px] w-[68px] text-center mr-4">
                {exercise.loadRange ?? '—'}
            </Text>
            <TextInput
                className="text-label text-[15px] bg-surface-tertiary rounded-lg w-[64px] text-center py-1.5"
                placeholder="—"
                placeholderTextColor="#636366"
                keyboardType="numeric"
                cursorColor="#0A84FF"
                selectionColor="#0A84FF"
                defaultValue={exercise.loadActual != null ? String(exercise.loadActual) : ''}
                onEndEditing={(e) => saveExercise('loadActual', e.nativeEvent.text)}
            />
            <TextInput
                className="text-label text-[15px] bg-surface-tertiary rounded-lg w-[52px] text-center py-1.5 ml-3"
                placeholder="—"
                placeholderTextColor="#636366"
                keyboardType="numeric"
                cursorColor="#0A84FF"
                selectionColor="#0A84FF"
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
    const [text, setText] = useState(value ?? '')
    const [saving, setSaving] = useState(false)

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
            setSaving(false)
        }
    }, [weekId, text])

    return (
        <View className="bg-surface-secondary rounded-xl px-4 py-3">
            <Text className="text-label-tertiary text-[11px] font-semibold uppercase tracking-wide mb-2">
                {label}
            </Text>
            {editable ? (
                <View>
                    <TextInput
                        className="text-label text-[15px] leading-[22px]"
                        placeholder="Write a note..."
                        placeholderTextColor="#636366"
                        multiline
                        textAlignVertical="top"
                        cursorColor="#0A84FF"
                        selectionColor="#0A84FF"
                        value={text}
                        onChangeText={setText}
                    />
                    <View className="flex-row justify-end mt-3">
                        <Pressable
                            onPress={handleSave}
                            disabled={saving}
                            className="bg-label rounded-lg px-4 py-1.5 active:opacity-80"
                            accessibilityRole="button"
                            accessibilityLabel="Save note"
                        >
                            <Text className="text-surface text-[13px] font-semibold">
                                {saving ? 'Saving...' : 'Save'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            ) : (
                <Text className="text-label-secondary text-[15px] leading-[22px]">
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
    return (
        <Pressable
            onPress={onPress}
            className="bg-surface-secondary rounded-xl px-4 py-3 flex-row items-center justify-between active:opacity-80"
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ expanded: isOpen }}
        >
            <Text className="text-label text-[13px] font-medium" numberOfLines={1}>
                {label}
            </Text>
            <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="#8E8E93"
                style={{ marginLeft: 4 }}
            />
        </Pressable>
    )
}

function DropdownList({ children }: { children: React.ReactNode }) {
    return (
        <View
            className="absolute left-0 right-0 mt-2 bg-surface-secondary rounded-xl overflow-hidden"
            style={{ top: '100%', zIndex: 20 }}
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
    return (
        <Pressable
            onPress={onPress}
            className={`flex-row items-center justify-between px-4 py-3 active:opacity-80 ${
                isLast ? '' : 'border-b border-[#38383A]'
            }`}
            accessibilityRole="button"
            accessibilityLabel={label}
        >
            <Text
                className={`text-[15px] ${
                    isActive ? 'text-accent-blue font-medium' : 'text-label'
                }`}
            >
                {label}
            </Text>
            {isActive && <Ionicons name="checkmark" size={18} color="#0A84FF" />}
        </Pressable>
    )
}
