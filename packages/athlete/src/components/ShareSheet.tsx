import { Ionicons } from '@expo/vector-icons'
import { Asset, requestPermissionsAsync } from 'expo-media-library'
import { useEffect, useRef } from 'react'
import { Animated, Dimensions, Image, Modal, Pressable, Text, View } from 'react-native'

import { useActiveTheme } from '../stores/themeStore'

interface ShareSheetProps {
    visible: boolean
    imageUri: string | null
    onClose: () => void
    onSaved: () => void
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const SHEET_HEIGHT = 440

export function ShareSheet({ visible, imageUri, onClose, onSaved }: ShareSheetProps) {
    const c = useActiveTheme().colors
    const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current
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
            translateY.setValue(SHEET_HEIGHT)
            overlayOpacity.setValue(0)
        }
    }, [visible, translateY, overlayOpacity])

    const handleSaveToPhotos = async () => {
        if (!imageUri) return
        const { status } = await requestPermissionsAsync()
        if (status !== 'granted') return
        await Asset.create(imageUri)
        onSaved()
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
                className="absolute bottom-0 left-0 right-0 rounded-t-[20px] pt-4 pb-10 px-6"
                style={{
                    height: SHEET_HEIGHT,
                    backgroundColor: c.surfaceTertiary,
                    transform: [{ translateY }],
                }}
            >
                <View className="items-center mb-5">
                    <View
                        className="w-10 h-1 rounded-full"
                        style={{ backgroundColor: c.border }}
                    />
                </View>

                <Text
                    className="text-[18px] font-bold text-center mb-5"
                    style={{ color: c.label }}
                >
                    Exercise Table
                </Text>

                {imageUri ? (
                    <View className="flex-1 rounded-2xl overflow-hidden mb-5">
                        <Image
                            source={{ uri: imageUri }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                        />
                    </View>
                ) : (
                    <View className="flex-1 items-center justify-center mb-5">
                        <Text className="text-[15px]" style={{ color: c.labelSecondary }}>
                            Generating preview...
                        </Text>
                    </View>
                )}

                <View className="flex-row" style={{ gap: 10 }}>
                    <Pressable
                        onPress={handleSaveToPhotos}
                        className="flex-1 rounded-2xl py-3.5 flex-row items-center justify-center active:opacity-80"
                        style={{ backgroundColor: c.accent }}
                        accessibilityRole="button"
                        accessibilityLabel="Save to Photos"
                    >
                        <Ionicons name="arrow-down-circle-outline" size={20} color={c.label} />
                        <Text
                            className="text-[15px] font-semibold ml-2"
                            style={{ color: c.label }}
                        >
                            Save
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={onClose}
                        className="flex-1 rounded-2xl py-3.5 flex-row items-center justify-center active:opacity-80"
                        style={{ backgroundColor: c.surfaceSecondary }}
                        accessibilityRole="button"
                        accessibilityLabel="Cancel"
                    >
                        <Text
                            className="text-[15px] font-semibold"
                            style={{ color: c.label }}
                        >
                            Cancel
                        </Text>
                    </Pressable>
                </View>
            </Animated.View>
        </Modal>
    )
}
