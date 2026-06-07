import { useState } from 'react'
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import InputField from '../components/InputField'
import { ApiError, useAuthStore } from '../stores/authStore'
import { useActiveTheme } from '../stores/themeStore'
import type { RootStackParamList } from './types'

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>

export default function SignUpScreen({ navigation }: Props) {
    const signUp = useAuthStore((s) => s.signUp)
    const theme = useActiveTheme()
    const c = theme.colors
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSignUp() {
        Keyboard.dismiss()
        setError('')

        if (!username.trim() || !email.trim() || !password.trim()) {
            setError('Please fill in all fields')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        try {
            await signUp(email.trim(), password, username.trim())
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
                <Pressable className="flex-1 px-6" onPress={Keyboard.dismiss}>
                    <View className="flex-1 justify-center" style={{ rowGap: 0 }}>
                        <Text
                            className="text-[34px] font-bold tracking-tight"
                            style={{ color: c.label }}
                        >
                            Create Account
                        </Text>
                        <Text
                            className="text-[17px] mb-12 mt-1"
                            style={{ color: c.labelSecondary }}
                        >
                            Join Conspiracy Barbell today
                        </Text>

                        <View style={{ rowGap: 20 }}>
                            <InputField
                                label="Username"
                                value={username}
                                onChangeText={setUsername}
                                placeholder="username"
                                autoCapitalize="none"
                            />
                            <InputField
                                label="Email"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="you@example.com"
                                keyboardType="email-address"
                            />
                            <InputField
                                label="Password"
                                value={password}
                                onChangeText={setPassword}
                                placeholder="At least 6 characters"
                                secureTextEntry
                            />
                        </View>

                        {error ? (
                            <Text
                                className="text-[15px] mt-4 text-center"
                                style={{ color: c.accent }}
                            >
                                {error}
                            </Text>
                        ) : null}

                        <Pressable
                            className="rounded-[14px] py-[17px] mt-6 items-center justify-center active:opacity-80 disabled:opacity-50"
                            style={{ backgroundColor: c.accent }}
                            onPress={handleSignUp}
                            disabled={loading}
                            accessibilityRole="button"
                            accessibilityLabel="Create Account"
                        >
                            {loading ? (
                                <ActivityIndicator color={c.label} size="small" />
                            ) : (
                                <Text
                                    className="text-center font-semibold text-[17px] tracking-tight"
                                    style={{ color: c.label }}
                                >
                                    Create Account
                                </Text>
                            )}
                        </Pressable>

                        <View className="flex-row justify-center mt-10">
                            <Text className="text-[15px]" style={{ color: c.labelSecondary }}>
                                Already have an account?{' '}
                            </Text>
                            <Pressable
                                onPress={() => navigation.goBack()}
                                accessibilityRole="button"
                                accessibilityLabel="Sign In"
                            >
                                <Text
                                    className="font-semibold text-[15px]"
                                    style={{ color: c.accent }}
                                >
                                    Sign In
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </Pressable>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
