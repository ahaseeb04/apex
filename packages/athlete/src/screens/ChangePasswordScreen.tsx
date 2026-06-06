import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useState } from 'react'
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import InputField from '../components/InputField'
import { ApiError } from '../lib/api'
import { changePassword } from '../lib/auth'
import { useActiveTheme } from '../stores/themeStore'
import { useToast } from '../hooks/use-toast'
import type { SettingsStackParamList } from './types'

type Props = NativeStackScreenProps<SettingsStackParamList, 'ChangePassword'>

export default function ChangePasswordScreen({ navigation }: Props) {
    const theme = useActiveTheme()
    const c = theme.colors
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { showToast } = useToast()

    const passwordsMatch = newPassword.length >= 6 && newPassword === confirmPassword

    async function handleChangePassword() {
        Keyboard.dismiss()
        setError('')

        if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
            setError('Please fill in all fields')
            return
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters')
            return
        }

        if (!passwordsMatch) {
            setError('New passwords do not match')
            return
        }

        setLoading(true)
        try {
            await changePassword(currentPassword, newPassword)
            showToast('Password Changed')
            navigation.goBack()
        } catch (e) {
            if (e instanceof ApiError) {
                setError(e.getErrorMessage())
            } else {
                setError('Unable to connect to server')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: c.surface }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <Pressable className="flex-1" onPress={Keyboard.dismiss}>
                    <ScrollView
                        className="flex-1"
                        contentContainerStyle={{ paddingBottom: 40 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View className="px-6 pt-4 pb-2">
                            <Pressable
                                onPress={() => navigation.goBack()}
                                className="w-8 h-8 items-center justify-center -ml-2 active:opacity-80 mb-1"
                                accessibilityRole="button"
                                accessibilityLabel="Go back"
                            >
                                <Ionicons name="chevron-back" size={24} color={c.accent} />
                            </Pressable>
                        </View>
                        <View className="px-6">
                            <Text
                                className="text-[34px] font-bold tracking-tight pb-2"
                                style={{ color: c.label }}
                            >
                                Change Password
                            </Text>
                            <Text className="text-[15px] pb-6" style={{ color: c.labelSecondary }}>
                                Enter your current password and a new one
                            </Text>
                        </View>

                        <View className="px-6" style={{ gap: 20 }}>
                            <InputField
                                label="Current Password"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Required"
                                secureTextEntry
                            />
                            <InputField
                                label="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="At least 6 characters"
                                secureTextEntry
                            />
                            <InputField
                                label="Confirm New Password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Re-enter new password"
                                secureTextEntry
                            />
                        </View>

                        {error ? (
                            <Text
                                className="text-[15px] mt-4 text-center px-6"
                                style={{ color: c.error }}
                            >
                                {error}
                            </Text>
                        ) : null}

                        <View className="px-6 mt-6">
                            <Pressable
                                className="rounded-[14px] py-[17px] items-center justify-center active:opacity-80 disabled:opacity-50"
                                style={{ backgroundColor: c.accent }}
                                onPress={handleChangePassword}
                                disabled={loading}
                                accessibilityRole="button"
                                accessibilityLabel="Change Password"
                            >
                                <Text
                                    className="text-center font-semibold text-[17px] tracking-tight"
                                    style={{ color: c.label }}
                                >
                                    {loading ? 'Changing...' : 'Change Password'}
                                </Text>
                            </Pressable>
                        </View>
                    </ScrollView>
                </Pressable>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
