import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { apiPatch } from '../lib/api'
import { getStoredToken } from '../lib/auth'
import { useActiveTheme } from '../stores/themeStore'
import type { HomeStackParamList } from './types'

type Props = NativeStackScreenProps<HomeStackParamList, 'Checkin'>

export default function CheckinScreen({ navigation, route }: Props) {
    const { weekId, existing } = route.params
    const theme = useActiveTheme()
    const c = theme.colors
    const [bodyweight, setBodyweight] = useState(
        existing?.bodyweight != null ? String(existing.bodyweight) : '',
    )
    const [calories, setCalories] = useState(
        existing?.calories != null ? String(existing.calories) : '',
    )
    const [sleepHours, setSleepHours] = useState(
        existing?.sleep_hours != null ? String(existing.sleep_hours) : '',
    )
    const [saving, setSaving] = useState(false)

    const handleSave = useCallback(async () => {
        const bw = bodyweight.trim() ? Number(bodyweight) : null
        const cal = calories.trim() ? Number(calories) : null
        const sleep = sleepHours.trim() ? Number(sleepHours) : null
        setSaving(true)
        try {
            const token = await getStoredToken()
            if (!token) return
            await apiPatch(
                `/api/weeks/${weekId}`,
                {
                    weeklyCheckIn: {
                        bodyweight: bw,
                        calories: cal,
                        sleep_hours: sleep,
                    },
                },
                token,
            )
            navigation.goBack()
        } finally {
            setSaving(false)
        }
    }, [weekId, bodyweight, calories, sleepHours, navigation])

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: c.surface }}>
            <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
                <Pressable
                    onPress={() => navigation.goBack()}
                    className="w-8 h-8 items-center justify-center active:opacity-80"
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="chevron-back" size={24} color={c.accent} />
                </Pressable>
                <Text className="text-[17px] font-semibold" style={{ color: c.label }}>
                    Weekly Check-In
                </Text>
                <Pressable
                    onPress={handleSave}
                    disabled={saving}
                    className="active:opacity-80"
                >
                    <Text className="text-[17px] font-semibold" style={{ color: c.accent }}>
                        {saving ? 'Saving...' : 'Save'}
                    </Text>
                </Pressable>
            </View>

            <View className="px-6 mt-6" style={{ gap: 20 }}>
                <View style={{ gap: 6 }}>
                    <Text className="text-[13px] font-medium uppercase tracking-wide ml-1" style={{ color: c.labelSecondary }}>
                        Bodyweight
                    </Text>
                    <TextInput
                        className="text-[17px] rounded-xl px-4 py-3.5"
                        style={{ backgroundColor: c.surfaceTertiary, color: c.label }}
                        placeholder="lbs"
                        placeholderTextColor={c.labelTertiary}
                        value={bodyweight}
                        onChangeText={setBodyweight}
                        keyboardType="decimal-pad"
                        cursorColor={c.accent}
                        selectionColor={c.accent}
                    />
                </View>
                <View style={{ gap: 6 }}>
                    <Text className="text-[13px] font-medium uppercase tracking-wide ml-1" style={{ color: c.labelSecondary }}>
                        Calories
                    </Text>
                    <TextInput
                        className="text-[17px] rounded-xl px-4 py-3.5"
                        style={{ backgroundColor: c.surfaceTertiary, color: c.label }}
                        placeholder="kcal"
                        placeholderTextColor={c.labelTertiary}
                        value={calories}
                        onChangeText={setCalories}
                        keyboardType="decimal-pad"
                        cursorColor={c.accent}
                        selectionColor={c.accent}
                    />
                </View>
                <View style={{ gap: 6 }}>
                    <Text className="text-[13px] font-medium uppercase tracking-wide ml-1" style={{ color: c.labelSecondary }}>
                        Sleep Hours
                    </Text>
                    <TextInput
                        className="text-[17px] rounded-xl px-4 py-3.5"
                        style={{ backgroundColor: c.surfaceTertiary, color: c.label }}
                        placeholder="hours"
                        placeholderTextColor={c.labelTertiary}
                        value={sleepHours}
                        onChangeText={setSleepHours}
                        keyboardType="decimal-pad"
                        cursorColor={c.accent}
                        selectionColor={c.accent}
                    />
                </View>
            </View>
        </SafeAreaView>
    )
}
