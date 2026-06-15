import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useRef, useState } from 'react'
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { ApiError } from '../lib/api'
import { resendVerification } from '../lib/auth'
import { useActiveTheme } from '../stores/themeStore'
import { useToast } from '../hooks/use-toast'
import { useAuthStore } from '../stores/authStore'
import type { RootStackParamList } from './types'

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>
const DIGIT_COUNT = 6

export default function VerifyEmailScreen({ route }: Props) {
    const { userId, email } = route.params
    const verifyEmail = useAuthStore((s) => s.verifyEmail)
    const theme = useActiveTheme()
    const c = theme.colors
    const { showToast } = useToast()
    const [digits, setDigits] = useState<string[]>(Array(DIGIT_COUNT).fill(''))
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)
    const inputRefs = useRef<(TextInput | null)[]>([])

    const code = digits.join('')

    function focusInput(index: number) {
        inputRefs.current[index]?.focus()
    }

    function handleChange(text: string, index: number) {
        const cleaned = text.replace(/[^0-9]/g, '')

        if (cleaned.length === 0) {
            const next = [...digits]
            next[index] = ''
            setDigits(next)
            return
        }

        if (cleaned.length >= DIGIT_COUNT) {
            const pasted = cleaned.slice(0, DIGIT_COUNT).split('')
            setDigits(pasted)
            focusInput(DIGIT_COUNT - 1)
            return
        }

        const next = [...digits]

        for (let i = 0; i < cleaned.length && index + i < DIGIT_COUNT; i++) {
            next[index + i] = cleaned[i]
        }

        setDigits(next)

        const nextFocus = Math.min(index + cleaned.length, DIGIT_COUNT - 1)
        focusInput(nextFocus)
    }

    function handleKeyPress(key: string, index: number) {
        if (key === 'Backspace' && digits[index] === '' && index > 0) {
            const next = [...digits]
            next[index - 1] = ''
            setDigits(next)
            focusInput(index - 1)
        }
    }

    async function handleVerify() {
        Keyboard.dismiss()
        setError('')

        if (code.length !== DIGIT_COUNT) {
            setError('Please enter the 6-digit code')
            return
        }

        setLoading(true)

        try {
            await verifyEmail(userId, code)
            showToast('Email verified', 'success')
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

    async function handleResend() {
        Keyboard.dismiss()
        setError('')
        setResending(true)
        try {
            await resendVerification(userId)
        } catch (e) {
            if (e instanceof ApiError) {
                setError(e.getErrorMessage())
            } else {
                setError('Unable to connect to server')
            }
        } finally {
            setResending(false)
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
                            Verify Email
                        </Text>
                        <Text
                            className="text-[17px] mb-12 mt-1"
                            style={{ color: c.labelSecondary }}
                        >
                            Enter the 6-digit code sent to {email}
                        </Text>

                        <View className="flex-row" style={{ gap: 10 }}>
                            {digits.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => {
                                        inputRefs.current[index] = ref
                                    }}
                                    className="flex-1 text-[22px] font-semibold rounded-[12px] py-[16px] text-center"
                                    style={{ backgroundColor: c.surfaceTertiary, color: c.label }}
                                    value={digit}
                                    onChangeText={(text) => handleChange(text, index)}
                                    onKeyPress={({ nativeEvent }) =>
                                        handleKeyPress(nativeEvent.key, index)
                                    }
                                    keyboardType="number-pad"
                                    maxLength={DIGIT_COUNT}
                                    selectionColor={c.accent}
                                    cursorColor={c.accent}
                                    accessibilityLabel={`Digit ${index + 1}`}
                                />
                            ))}
                        </View>

                        {error ? (
                            <Text
                                className="text-[15px] mt-4 text-center"
                                style={{ color: c.error }}
                            >
                                {error}
                            </Text>
                        ) : null}

                        <Pressable
                            className="rounded-[14px] py-[17px] mt-6 items-center justify-center active:opacity-80 disabled:opacity-50"
                            style={{ backgroundColor: c.accent }}
                            onPress={handleVerify}
                            disabled={loading}
                            accessibilityRole="button"
                            accessibilityLabel="Verify Email"
                        >
                            {loading ? (
                                <ActivityIndicator color={c.label} size="small" />
                            ) : (
                                <Text
                                    className="text-center font-semibold text-[17px] tracking-tight"
                                    style={{ color: c.label }}
                                >
                                    Verify
                                </Text>
                            )}
                        </Pressable>

                        <View className="flex-row justify-center mt-8">
                            <Text className="text-[15px]" style={{ color: c.labelSecondary }}>
                                Did not receive a code?{' '}
                            </Text>
                            <Pressable
                                onPress={handleResend}
                                disabled={resending}
                                accessibilityRole="button"
                                accessibilityLabel="Resend code"
                            >
                                {resending ? (
                                    <ActivityIndicator color={c.accent} size="small" />
                                ) : (
                                    <Text
                                        className="font-semibold text-[15px]"
                                        style={{ color: c.accent }}
                                    >
                                        Resend
                                    </Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </Pressable>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
