import Slider from '@react-native-community/slider'
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { apiPatch } from '../lib/api'
import { getStoredToken } from '../lib/auth'
import { useActiveTheme } from '../stores/themeStore'
import type { HomeStackParamList } from './types'
import { useToast } from '../hooks/use-toast'

const labels: Record<string, string> = {
    sleep_quality: 'Sleep Quality',
    cognitive_capacity: 'Cognitive Capacity',
    general_motivation: 'General Motivation',
    motivation_to_train: 'Motivation to Train',
    sense_of_wellbeing: 'Sense of Wellbeing',
    perceived_stress: 'Perceived Stress',
    energy_levels: 'Energy Levels',
    libido: 'Libido',
    soreness: 'Soreness',
}

const keys = Object.keys(labels)

type Props = NativeStackScreenProps<HomeStackParamList, 'Fatigue'>

export default function FatigueScreen({ navigation, route }: Props) {
    const { weekId, existing } = route.params
    const theme = useActiveTheme()
    const c = theme.colors
    const [values, setValues] = useState<Record<string, number>>(existing ?? {})
    const [saving, setSaving] = useState(false)
    const { showToast } = useToast()

    const handleSave = useCallback(async () => {
        setSaving(true)
        try {
            const token = await getStoredToken()
            if (!token) return
            const allZero = keys.every((k) => !values[k])
            await apiPatch(`/api/weeks/${weekId}`, { fatigueIndex: allZero ? null : values }, token)
            navigation.goBack()
        } finally {
            showToast('Saved')
            setSaving(false)
        }
    }, [weekId, values, navigation])

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
                    Fatigue Index
                </Text>
                <Pressable onPress={handleSave} disabled={saving} className="active:opacity-80">
                    <Text className="text-[17px] font-semibold" style={{ color: c.accent }}>
                        {saving ? 'Saving...' : 'Save'}
                    </Text>
                </Pressable>
            </View>

            <ScrollView
                className="flex-1 px-6"
                contentContainerStyle={{ paddingBottom: 32, gap: 24 }}
            >
                {keys.map((key) => (
                    <View key={key} style={{ gap: 6 }}>
                        <View className="flex-row items-center justify-between">
                            <Text className="text-[15px] font-medium" style={{ color: c.label }}>
                                {labels[key]}
                            </Text>
                            <Text
                                className="text-[15px] font-semibold w-5 text-center"
                                style={{ color: c.accent }}
                            >
                                {values[key] ?? 0}
                            </Text>
                        </View>
                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={0}
                            maximumValue={5}
                            step={1}
                            value={values[key] ?? 0}
                            onValueChange={(v) =>
                                setValues((prev) => ({ ...prev, [key]: Math.round(v) }))
                            }
                            minimumTrackTintColor={c.accent}
                            maximumTrackTintColor={c.surfaceTertiary}
                            thumbTintColor={c.accent}
                        />
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    )
}
