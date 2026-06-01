import { Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAuthStore } from '../stores/authStore'

export default function HomeScreen() {
    const user = useAuthStore((s) => s.user)
    const signOut = useAuthStore((s) => s.signOut)

    return (
        <SafeAreaView className="flex-1 bg-surface">
            <View className="flex-1 items-center justify-center px-6">
                <Text className="text-label text-[28px] font-bold tracking-tight">
                    Welcome, {user?.username}
                </Text>
                <Text className="text-label-secondary text-[17px] mt-2">
                    {user?.email}
                </Text>

                <Pressable
                    className="bg-accent-blue rounded-[14px] py-[17px] px-10 mt-16 active:opacity-80"
                    onPress={signOut}
                    accessibilityRole="button"
                    accessibilityLabel="Sign Out"
                >
                    <Text className="text-label font-semibold text-[17px] tracking-tight">
                        Sign Out
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    )
}
