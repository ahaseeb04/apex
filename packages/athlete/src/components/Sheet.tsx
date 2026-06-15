import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { Animated, Dimensions, Modal, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useActiveTheme } from '../stores/themeStore'

interface SheetProps {
    visible: boolean
    onClose: () => void
    children: ReactNode
    height?: number
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

export function Sheet({ visible, onClose, children, height }: SheetProps) {
    const c = useActiveTheme().colors
    const insets = useSafeAreaInsets()
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current
    const overlayOpacity = useRef(new Animated.Value(0)).current

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
        }
    }, [visible, translateY, overlayOpacity])

    if (!visible) return null

    return (
        <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
            <Animated.View className="flex-1" style={{ opacity: overlayOpacity }}>
                <Pressable className="flex-1" onPress={onClose}>
                    <View className="flex-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
                </Pressable>
            </Animated.View>

            <Animated.View
                className="absolute bottom-0 left-0 right-0 rounded-t-[20px] pt-4 px-6"
                style={{
                    height,
                    backgroundColor: c.surfaceSecondary,
                    paddingBottom: insets.bottom + 20,
                    transform: [{ translateY }],
                }}
            >
                <View className="items-center mb-5">
                    <View className="w-10 h-1 rounded-full" style={{ backgroundColor: c.border }} />
                </View>

                {children}
            </Animated.View>
        </Modal>
    )
}
