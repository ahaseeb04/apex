import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { apiGet, ApiError, type ProgramData } from '../lib/api'
import { getStoredToken } from '../lib/auth'
import { useAuthStore } from '../stores/authStore'
import type { HomeStackParamList } from './types'

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeList'>

export default function HomeScreen({ navigation }: Props) {
    const signOut = useAuthStore((s) => s.signOut)
    const [programs, setPrograms] = useState<ProgramData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadPrograms = useCallback(async (isRefresh = false) => {
        try {
            setError(null)
            if (!isRefresh) setIsLoading(true)
            const token = await getStoredToken()
            if (!token) return
            const data = await apiGet('/api/programs', token)
            setPrograms(data as ProgramData[])
        } catch (err) {
            setError(err instanceof ApiError ? err.getErrorMessage() : 'Failed to load programs')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    useEffect(() => {
        loadPrograms()
    }, [loadPrograms])

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true)
        loadPrograms(true)
    }, [loadPrograms])

    return (
        <SafeAreaView className="flex-1 bg-surface">
            <View className="flex-1 px-6">
                <View className="flex-row items-center justify-between pt-4 pb-6">
                    <Text className="text-label text-[34px] font-bold tracking-tight">
                        Programs
                    </Text>
                    <Pressable
                        onPress={signOut}
                        accessibilityRole="button"
                        accessibilityLabel="Sign Out"
                    >
                        <Text className="text-accent-blue text-[15px] font-medium active:opacity-80">
                            Sign Out
                        </Text>
                    </Pressable>
                </View>

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#0A84FF" />
                    </View>
                ) : error ? (
                    <View className="flex-1 items-center justify-center px-4">
                        <Text className="text-accent-red text-[15px] text-center">{error}</Text>
                        <Pressable
                            className="mt-4 active:opacity-80"
                            onPress={() => loadPrograms()}
                            accessibilityRole="button"
                            accessibilityLabel="Retry loading programs"
                        >
                            <Text className="text-accent-blue text-[15px] font-medium">Retry</Text>
                        </Pressable>
                    </View>
                ) : programs.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-label-secondary text-[17px]">
                            No programs yet
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={programs}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 32 }}
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        ItemSeparatorComponent={() => <View className="h-3" />}
                        renderItem={({ item }) => (
                            <Pressable
                                onPress={() =>
                                    navigation.navigate('Program', {
                                        program: item,
                                    })
                                }
                                className="bg-surface-secondary rounded-[16px] p-5 active:opacity-80"
                                accessibilityRole="button"
                                accessibilityLabel={`${item.name} program`}
                            >
                                <Text
                                    className="text-label text-[17px] font-semibold"
                                    numberOfLines={1}
                                >
                                    {item.name}
                                </Text>
                                {item.description ? (
                                    <Text
                                        className="text-label-secondary text-[15px] mt-1"
                                        numberOfLines={2}
                                    >
                                        {item.description}
                                    </Text>
                                ) : null}
                                <View className="flex-row mt-3" style={{ gap: 16 }}>
                                    <MetadataBadge
                                        value={item.blocks.length}
                                        label="Block"
                                    />
                                    <MetadataBadge
                                        value={item.blocks.reduce(
                                            (sum, b) => sum + b.weeks.length,
                                            0,
                                        )}
                                        label="Week"
                                    />
                                </View>
                            </Pressable>
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    )
}

function MetadataBadge({ value, label }: { value: number; label: string }) {
    return (
        <View className="flex-row items-center" style={{ gap: 4 }}>
            <Text className="text-accent-blue text-[13px] font-medium">{value}</Text>
            <Text className="text-label-tertiary text-[13px]">
                {value === 1 ? label : `${label}s`}
            </Text>
        </View>
    )
}
