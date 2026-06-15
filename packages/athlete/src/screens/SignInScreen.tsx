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
import { isEmailVerificationEnabled } from '../lib/api'
import { useActiveTheme } from '../stores/themeStore'
import type { RootStackParamList } from './types'

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>

export default function SignInScreen({ navigation }: Props) {
    const signIn = useAuthStore((s) => s.signIn)
    const theme = useActiveTheme()
    const c = theme.colors
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSignIn() {
        Keyboard.dismiss()
        setError('')

        if (!email.trim() || !password.trim()) {
            setError('Please fill in all fields')
            return
        }

        setLoading(true)
        try {
            await signIn(email.trim(), password)
        } catch (e) {
            if (e instanceof ApiError) {
                if (
                    e.status === 403 &&
                    typeof e.body === 'object' &&
                    e.body !== null
                ) {
                    const body = e.body as Record<string, unknown>
                    if (
                        body.error === 'email not verified' &&
                        typeof body.userId === 'string' &&
                        typeof body.email === 'string'
                    ) {
                        if (isEmailVerificationEnabled()) {
                            navigation.navigate('VerifyEmail', {
                                userId: body.userId,
                                email: body.email,
                            })
                            return
                        }
                    }
                }
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
                    <View className="flex-1 justify-center" style={{ gap: 0 }}>
                        <Text
                            className="text-[32px] font-bold tracking-tight"
                            style={{ color: c.label }}
                        >
                            Sign in
                        </Text>
                        <Text
                            className="text-[16px] mt-1.5 mb-10"
                            style={{ color: c.labelSecondary }}
                        >
                            to continue to Conspiracy Barbell
                        </Text>

                        <View style={{ gap: 16 }}>
                            <InputField
                                label="Email address"
                                value={email}
                                onChangeText={setEmail}
                                placeholder="you@example.com"
                                keyboardType="email-address"
                            />
                            <InputField
                                label="Password"
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter your password"
                                secureTextEntry
                            />
                        </View>

                        {error ? (
                            <Text
                                className="text-[14px] mt-5 text-center"
                                style={{ color: c.error }}
                            >
                                {error}
                            </Text>
                        ) : null}

                        <Pressable
                            className="rounded-[12px] py-[16px] mt-8 items-center justify-center active:opacity-80 disabled:opacity-50"
                            style={{ backgroundColor: c.accent }}
                            onPress={handleSignIn}
                            disabled={loading}
                            accessibilityRole="button"
                            accessibilityLabel="Continue"
                        >
                            {loading ? (
                                <ActivityIndicator color={c.label} size="small" />
                            ) : (
                                <Text
                                    className="text-center font-semibold text-[16px]"
                                    style={{ color: c.label }}
                                >
                                    Continue
                                </Text>
                            )}
                        </Pressable>

                        <View className="flex-row justify-center mt-8">
                            <Text className="text-[15px]" style={{ color: c.labelSecondary }}>
                                Don't have an account?{' '}
                            </Text>
                            <Pressable
                                onPress={() => navigation.navigate('SignUp')}
                                accessibilityRole="button"
                                accessibilityLabel="Sign up"
                            >
                                <Text
                                    className="font-semibold text-[15px]"
                                    style={{ color: c.accent }}
                                >
                                    Sign up
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </Pressable>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
