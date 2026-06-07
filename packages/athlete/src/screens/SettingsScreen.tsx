import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { DeleteAccountSheet } from '../components/DeleteAccountSheet'
import { useAuthStore } from '../stores/authStore'
import { useActiveTheme } from '../stores/themeStore'
import type { SettingsStackParamList } from './types'
import { useToast } from '../hooks/use-toast'

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsList'>

export default function SettingsScreen({ navigation }: Props) {
    const signOut = useAuthStore((s) => s.signOut)
    const theme = useActiveTheme()
    const c = theme.colors
    const [showDeleteSheet, setShowDeleteSheet] = useState(false)
    const { showToast } = useToast()

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: c.surface }}>
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
                <View className="px-6">
                    <Text
                        className="text-[34px] font-bold tracking-tight pt-4 pb-6"
                        style={{ color: c.label }}
                    >
                        Settings
                    </Text>
                </View>

                <Pressable
                    onPress={() => navigation.navigate('Appearance')}
                    className="mx-6 rounded-xl px-4 py-3.5 flex-row items-center justify-between active:opacity-80"
                    style={{ backgroundColor: c.surfaceSecondary }}
                    accessibilityRole="button"
                    accessibilityLabel="Theme settings"
                >
                    <View className="flex-row items-center" style={{ gap: 10 }}>
                        <Ionicons name="color-palette-outline" size={20} color={c.accent} />
                        <View>
                            <Text className="text-[15px] font-medium" style={{ color: c.label }}>
                                Theme
                            </Text>
                            <Text
                                className="text-[13px] mt-0.5"
                                style={{ color: c.labelSecondary }}
                            >
                                {theme.name}
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={c.labelTertiary} />
                </Pressable>

                <View
                    className="mx-6 mt-6 rounded-xl px-4 py-3"
                    style={{ backgroundColor: c.surfaceSecondary }}
                >
                    <Text
                        className="text-[11px] font-semibold uppercase tracking-wide mb-1"
                        style={{ color: c.labelTertiary }}
                    >
                        Account
                    </Text>
                    <Pressable
                        onPress={() => navigation.navigate('ChangePassword')}
                        className="py-2.5 active:opacity-80"
                        accessibilityRole="button"
                        accessibilityLabel="Change password"
                    >
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center" style={{ gap: 10 }}>
                                <Ionicons name="lock-closed-outline" size={20} color={c.accent} />
                                <Text
                                    className="text-[15px] font-medium"
                                    style={{ color: c.label }}
                                >
                                    Change Password
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={c.labelTertiary} />
                        </View>
                    </Pressable>
                    <View className="h-px" style={{ backgroundColor: c.border }} />
                    <Pressable
                        onPress={() => setShowDeleteSheet(true)}
                        className="py-2.5 active:opacity-80"
                        accessibilityRole="button"
                        accessibilityLabel="Delete account"
                    >
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center" style={{ gap: 10 }}>
                                <Ionicons name="trash-outline" size={20} color={c.accent} />
                                <Text
                                    className="text-[15px] font-medium"
                                    style={{ color: c.label }}
                                >
                                    Delete Account
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={c.labelTertiary} />
                        </View>
                    </Pressable>
                </View>

                <View
                    className="mx-6 mt-6 rounded-xl px-4 py-3"
                    style={{ backgroundColor: c.surfaceSecondary }}
                >
                    <Text
                        className="text-[11px] font-semibold uppercase tracking-wide mb-2"
                        style={{ color: c.labelTertiary }}
                    >
                        About
                    </Text>
                    <Text
                        className="text-[15px] leading-[22px]"
                        style={{ color: c.labelSecondary }}
                    >
                        Conspiracy Barbell v1.0
                    </Text>
                </View>

                <View className="mx-6 mt-10">
                    <Pressable
                        onPress={signOut}
                        className="active:opacity-80"
                        accessibilityRole="button"
                        accessibilityLabel="Sign Out"
                    >
                        <Text
                            className="text-[15px] text-center font-semibold"
                            style={{ color: c.accent }}
                        >
                            Sign Out
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>

            <DeleteAccountSheet
                visible={showDeleteSheet}
                onClose={() => setShowDeleteSheet(false)}
                onDeleted={() => showToast('Account removed. No trace left behind', 'info')}
            />
        </SafeAreaView>
    )
}
