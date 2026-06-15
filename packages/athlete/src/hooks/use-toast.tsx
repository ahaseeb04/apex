import { Ionicons } from '@expo/vector-icons'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Animated, Text } from 'react-native'

import { useActiveTheme } from '../stores/themeStore'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastContextValue {
    showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const variantConfig: Record<
    ToastVariant,
    { icon: keyof typeof Ionicons.glyphMap; colorKey: 'success' | 'error' | 'info' }
> = {
    success: { icon: 'checkmark-circle', colorKey: 'success' },
    error: { icon: 'alert-circle', colorKey: 'error' },
    info: { icon: 'information-circle', colorKey: 'info' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const c = useActiveTheme().colors
    const [visible, setVisible] = useState(false)
    const [message, setMessage] = useState('')
    const [variant, setVariant] = useState<ToastVariant>('success')
    const opacity = useRef(new Animated.Value(0)).current
    const translateY = useRef(new Animated.Value(20)).current

    useEffect(() => {
        if (!visible) return

        opacity.setValue(0)
        translateY.setValue(20)

        Animated.sequence([
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]),
            Animated.delay(1400),
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 20,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]),
        ]).start(() => setVisible(false))
    }, [visible, opacity, translateY])

    const showToast = useCallback((msg: string, v: ToastVariant = 'success') => {
        setMessage(msg)
        setVariant(v)
        setVisible(true)
    }, [])

    const config = variantConfig[variant]
    const color = c[config.colorKey]

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {visible && (
                <Animated.View
                    className="absolute bottom-28 left-6 right-6 rounded-2xl px-5 py-3.5 flex-row items-center border"
                    style={{
                        backgroundColor: c.surfaceSecondary,
                        borderColor: color,
                        opacity,
                        transform: [{ translateY }],
                    }}
                >
                    <Ionicons name={config.icon} size={18} color={color} />
                    <Text className="text-[15px] font-medium ml-2.5" style={{ color: c.label }}>
                        {message}
                    </Text>
                </Animated.View>
            )}
        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within a ToastProvider')
    return ctx
}
