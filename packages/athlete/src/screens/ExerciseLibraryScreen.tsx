import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useActiveTheme } from '../stores/themeStore'

export default function ExerciseLibraryScreen() {
    const theme = useActiveTheme()
    const c = theme.colors

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: c.surface }}>
            <View className="flex-1 items-center justify-center px-6">
                <Text className="text-[34px] font-bold tracking-tight" style={{ color: c.label }}>
                    Library
                </Text>
                <Text className="text-[15px] mt-2" style={{ color: c.labelSecondary }}>
                    Exercise videos coming soon
                </Text>
            </View>
        </SafeAreaView>
    )
}
