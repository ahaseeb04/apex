import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { themes } from '../lib/themes'
import { useActiveTheme, useThemeStore } from '../stores/themeStore'
import type { SettingsStackParamList } from './types'

type Props = NativeStackScreenProps<SettingsStackParamList, 'Appearance'>

export default function AppearanceScreen({ navigation }: Props) {
    const activeThemeId = useThemeStore((s) => s.activeThemeId)
    const setTheme = useThemeStore((s) => s.setTheme)
    const activeTheme = useActiveTheme()

    return (
        <SafeAreaView
            className="flex-1"
            style={{ backgroundColor: activeTheme.colors.surface }}
        >
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                <View className="px-6 pt-4 pb-2">
                    <Pressable
                        onPress={() => navigation.goBack()}
                        className="w-8 h-8 items-center justify-center -ml-2 active:opacity-80 mb-1"
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <Ionicons name="chevron-back" size={24} color={activeTheme.colors.accent} />
                    </Pressable>
                </View>
                <View className="px-6">
                    <Text
                        className="text-[34px] font-bold tracking-tight pb-2"
                        style={{ color: activeTheme.colors.label }}
                    >
                        Appearance
                    </Text>
                    <Text
                        className="text-[15px] pb-6"
                        style={{ color: activeTheme.colors.labelSecondary }}
                    >
                        Choose a theme for the app
                    </Text>
                </View>

                {themes.map((theme) => {
                    const isActive = theme.id === activeThemeId
                    const c = theme.colors

                    return (
                        <Pressable
                            key={theme.id}
                            onPress={() => setTheme(theme.id)}
                            className={`mx-6 mb-3 rounded-xl overflow-hidden active:opacity-90 ${
                                isActive ? 'border-2' : 'border'
                            }`}
                            style={{
                                borderColor: isActive ? c.accent : c.border,
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`${theme.name} theme`}
                            accessibilityState={{ selected: isActive }}
                        >
                            <View style={{ backgroundColor: c.surface }}>
                                <View className="px-4 py-3 flex-row items-center justify-between">
                                    <View className="flex-row items-center" style={{ gap: 12 }}>
                                        <View
                                            className="w-8 h-8 rounded-lg flex-row overflow-hidden"
                                            style={{ borderWidth: 1, borderColor: c.border }}
                                        >
                                            <View
                                                className="flex-1"
                                                style={{ backgroundColor: c.surfaceSecondary }}
                                            />
                                            <View
                                                className="flex-1"
                                                style={{ backgroundColor: c.accent }}
                                            />
                                        </View>
                                        <Text
                                            className="text-[15px] font-medium"
                                            style={{ color: c.label }}
                                        >
                                            {theme.name}
                                        </Text>
                                    </View>
                                    {isActive && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={22}
                                            color={c.accent}
                                        />
                                    )}
                                </View>

                                <View
                                    className="flex-row px-4 pb-3"
                                    style={{ gap: 6 }}
                                >
                                    {[
                                        c.surfaceSecondary,
                                        c.surfaceTertiary,
                                        c.accent,
                                        c.label,
                                        c.labelSecondary,
                                    ].map((color, ci) => (
                                        <View
                                            key={ci}
                                            className="w-5 h-5 rounded-full"
                                            style={{
                                                backgroundColor: color,
                                                borderWidth: 0.5,
                                                borderColor: c.border,
                                            }}
                                        />
                                    ))}
                                </View>
                            </View>
                        </Pressable>
                    )
                })}
            </ScrollView>
        </SafeAreaView>
    )
}
