import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ExerciseLibraryScreen() {
    return (
        <SafeAreaView className="flex-1 bg-surface">
            <View className="flex-1 items-center justify-center px-6">
                <Text className="text-label text-[34px] font-bold tracking-tight">
                    Library
                </Text>
                <Text className="text-label-secondary text-[15px] mt-2">
                    Exercise videos coming soon
                </Text>
            </View>
        </SafeAreaView>
    )
}
