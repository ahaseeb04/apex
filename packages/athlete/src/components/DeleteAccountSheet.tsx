import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Keyboard, Pressable, Text, View } from 'react-native'

import { ApiError } from '../lib/api'
import { useActiveTheme } from '../stores/themeStore'
import { useAuthStore } from '../stores/authStore'
import InputField from './InputField'
import { Sheet } from './Sheet'

interface DeleteAccountSheetProps {
    visible: boolean
    onClose: () => void
    onDeleted: () => void
}

export function DeleteAccountSheet({ visible, onClose, onDeleted }: DeleteAccountSheetProps) {
    const c = useActiveTheme().colors
    const deleteAccount = useAuthStore((s) => s.deleteAccount)
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        Keyboard.dismiss()
        setError('')

        if (!password) {
            setError('Enter your password to confirm')
            return
        }

        setLoading(true)
        try {
            await deleteAccount(password)
            onDeleted()
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

    const handleClose = () => {
        setPassword('')
        setError('')
        setLoading(false)
        onClose()
    }

    return (
        <Sheet visible={visible} onClose={handleClose}>
            <View className="items-center mb-5">
                <View
                    className="w-14 h-14 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: c.surfaceTertiary }}
                >
                    <Ionicons name="alert-circle-outline" size={28} color={c.error} />
                </View>
                <Text className="text-[20px] font-bold text-center" style={{ color: c.label }}>
                    Delete Account
                </Text>
                <Text
                    className="text-[14px] text-center mt-1 leading-[20px]"
                    style={{ color: c.labelSecondary }}
                >
                    This will permanently delete your{'\n'}account and all associated data
                </Text>
            </View>

            <InputField
                label="Confirm password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
            />

            {error ? (
                <View className="flex-row items-center justify-center mt-3" style={{ gap: 6 }}>
                    <Ionicons name="close-circle" size={14} color={c.error} />
                    <Text className="text-[13px] font-medium" style={{ color: c.error }}>
                        {error}
                    </Text>
                </View>
            ) : null}

            <View className="flex-row mt-6" style={{ gap: 10 }}>
                <Pressable
                    onPress={handleClose}
                    className="flex-1 rounded-2xl py-[14px] items-center justify-center active:opacity-80"
                    style={{ backgroundColor: c.surfaceTertiary }}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel"
                >
                    <Text className="text-[16px] font-semibold" style={{ color: c.label }}>
                        Cancel
                    </Text>
                </Pressable>
                <Pressable
                    onPress={handleDelete}
                    className="flex-1 rounded-2xl py-[14px] flex-row items-center justify-center active:opacity-80"
                    style={{ backgroundColor: c.error }}
                    accessibilityRole="button"
                    accessibilityLabel="Delete account"
                    disabled={loading}
                >
                    {loading ? (
                        <Text className="text-[16px] font-semibold" style={{ color: c.label }}>
                            Deleting...
                        </Text>
                    ) : (
                        <>
                            <Ionicons name="trash-outline" size={18} color={c.label} />
                            <Text
                                className="text-[16px] font-semibold ml-1.5"
                                style={{ color: c.label }}
                            >
                                Delete
                            </Text>
                        </>
                    )}
                </Pressable>
            </View>
        </Sheet>
    )
}
