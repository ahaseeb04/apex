import { Ionicons } from '@expo/vector-icons'
import { Asset, requestPermissionsAsync } from 'expo-media-library'
import { Image, Pressable, Text, View } from 'react-native'

import { useActiveTheme } from '../stores/themeStore'
import { Sheet } from './Sheet'

interface ShareSheetProps {
    visible: boolean
    imageUri: string | null
    onClose: () => void
    onSaved: () => void
}

const SHEET_HEIGHT = 440

export function ShareSheet({ visible, imageUri, onClose, onSaved }: ShareSheetProps) {
    const c = useActiveTheme().colors

    const handleSaveToPhotos = async () => {
        if (!imageUri) return
        const { status } = await requestPermissionsAsync()
        if (status !== 'granted') return
        await Asset.create(imageUri)
        onSaved()
    }

    return (
        <Sheet visible={visible} onClose={onClose} height={SHEET_HEIGHT}>
            <Text className="text-[18px] font-bold text-center mb-5" style={{ color: c.label }}>
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
                    onPress={onClose}
                    className="flex-1 rounded-2xl py-3.5 items-center justify-center active:opacity-80"
                    style={{ backgroundColor: c.surfaceTertiary }}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel"
                >
                    <Text className="text-[15px] font-semibold" style={{ color: c.label }}>
                        Cancel
                    </Text>
                </Pressable>
                <Pressable
                    onPress={handleSaveToPhotos}
                    className="flex-1 rounded-2xl py-3.5 flex-row items-center justify-center active:opacity-80"
                    style={{ backgroundColor: c.accent }}
                    accessibilityRole="button"
                    accessibilityLabel="Save to Photos"
                >
                    <Ionicons name="arrow-down-circle-outline" size={20} color={c.label} />
                    <Text className="text-[15px] font-semibold ml-2" style={{ color: c.label }}>
                        Save
                    </Text>
                </Pressable>
            </View>
        </Sheet>
    )
}
