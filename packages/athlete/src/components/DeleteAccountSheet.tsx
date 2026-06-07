import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, Keyboard, Modal, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ApiError } from '../lib/api'
import { useActiveTheme } from '../stores/themeStore'
import { useAuthStore } from '../stores/authStore'
import InputField from './InputField'

interface DeleteAccountSheetProps {
    visible: boolean
    onClose: () => void
    onDeleted: () => void
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

export function DeleteAccountSheet({ visible, onClose, onDeleted }: DeleteAccountSheetProps) {
    const c = useActiveTheme().colors
    const insets = useSafeAreaInsets()
    const deleteAccount = useAuthStore((s) => s.deleteAccount)
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current
    const overlayOpacity = useRef(new Animated.Value(0)).current
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 22,
                    stiffness: 220,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start()
        } else {
            translateY.setValue(SCREEN_HEIGHT)
            overlayOpacity.setValue(0)
            setPassword('')
            setError('')
            setLoading(false)
        }
    }, [visible, translateY, overlayOpacity])

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

    if (!visible) return null

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            <Animated.View className="flex-1" style={{ opacity: overlayOpacity }}>
                <Pressable className="flex-1" onPress={onClose}>
                    <View className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} />
                </Pressable>
            </Animated.View>

            <Animated.View
                className="absolute bottom-0 left-0 right-0 rounded-t-[20px] pt-4 px-6"
                style={{
                    backgroundColor: c.surfaceSecondary,
                    paddingBottom: insets.bottom + 20,
                    transform: [{ translateY }],
                }}
            >
                <View className="items-center mb-5">
                    <View className="w-10 h-1 rounded-full" style={{ backgroundColor: c.border }} />
                </View>

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
                        This will permanently delete your account{'\n'}and all associated data
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
                        onPress={onClose}
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
            </Animated.View>
        </Modal>
    )
}
