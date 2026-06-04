import { Ionicons } from '@expo/vector-icons'
import { useEffect, useRef } from 'react'
import { Animated, Text } from 'react-native'

import { useActiveTheme } from '../stores/themeStore'

interface ToastProps {
    visible: boolean
    message: string
    onDone: () => void
}

export function Toast({ visible, message, onDone }: ToastProps) {
    const c = useActiveTheme().colors
    const opacity = useRef(new Animated.Value(0)).current
    const translateY = useRef(new Animated.Value(20)).current

    useEffect(() => {
        if (!visible) return

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
        ]).start(() => onDone())
    }, [visible, opacity, translateY, onDone])

    if (!visible) return null

    return (
        <Animated.View
            className="absolute bottom-28 left-6 right-6 rounded-2xl px-5 py-3.5 flex-row items-center border"
            style={{
                backgroundColor: c.surfaceSecondary,
                borderColor: c.accent,
                opacity,
                transform: [{ translateY }],
            }}
        >
            <Ionicons name="checkmark-circle" size={18} color={c.accent} />
            <Text className="text-[15px] font-medium ml-2.5" style={{ color: c.label }}>
                {message}
            </Text>
        </Animated.View>
    )
}
