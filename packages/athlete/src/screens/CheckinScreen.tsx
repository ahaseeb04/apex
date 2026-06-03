import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { apiPatch } from '../lib/api'
import { getStoredToken } from '../lib/auth'
import type { HomeStackParamList } from './types'

type Props = NativeStackScreenProps<HomeStackParamList, 'Checkin'>

export default function CheckinScreen({ navigation, route }: Props) {
    const { weekId, existing } = route.params
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
        <SafeAreaView className="flex-1 bg-surface">
            <View className="flex-row items-center justify-between px-6 pt-2 pb-4">
                <Pressable
                    onPress={() => navigation.goBack()}
                    className="w-8 h-8 items-center justify-center active:opacity-80"
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                >
                    <Ionicons name="chevron-back" size={24} color="#0A84FF" />
                </Pressable>
                <Text className="text-label text-[17px] font-semibold">
                    Weekly Check-In
                </Text>
                <Pressable
                    onPress={handleSave}
                    disabled={saving}
                    className="active:opacity-80"
                >
                    <Text className="text-accent-blue text-[17px] font-semibold">
                        {saving ? 'Saving...' : 'Save'}
                    </Text>
                </Pressable>
            </View>

            <View className="px-6 mt-6" style={{ gap: 20 }}>
                <View style={{ gap: 6 }}>
                    <Text className="text-label-secondary text-[13px] font-medium uppercase tracking-wide ml-1">
                        Bodyweight
                    </Text>
                    <TextInput
                        className="bg-surface-tertiary text-label text-[17px] rounded-xl px-4 py-3.5"
                        placeholder="lbs"
                        placeholderTextColor="#636366"
                        value={bodyweight}
                        onChangeText={setBodyweight}
                        keyboardType="decimal-pad"
                        cursorColor="#0A84FF"
                        selectionColor="#0A84FF"
                    />
                </View>
                <View style={{ gap: 6 }}>
                    <Text className="text-label-secondary text-[13px] font-medium uppercase tracking-wide ml-1">
                        Calories
                    </Text>
                    <TextInput
                        className="bg-surface-tertiary text-label text-[17px] rounded-xl px-4 py-3.5"
                        placeholder="kcal"
                        placeholderTextColor="#636366"
                        value={calories}
                        onChangeText={setCalories}
                        keyboardType="decimal-pad"
                        cursorColor="#0A84FF"
                        selectionColor="#0A84FF"
                    />
                </View>
                <View style={{ gap: 6 }}>
                    <Text className="text-label-secondary text-[13px] font-medium uppercase tracking-wide ml-1">
                        Sleep Hours
                    </Text>
                    <TextInput
                        className="bg-surface-tertiary text-label text-[17px] rounded-xl px-4 py-3.5"
                        placeholder="hours"
                        placeholderTextColor="#636366"
                        value={sleepHours}
                        onChangeText={setSleepHours}
                        keyboardType="decimal-pad"
                        cursorColor="#0A84FF"
                        selectionColor="#0A84FF"
                    />
                </View>
            </View>
        </SafeAreaView>
    )
}
