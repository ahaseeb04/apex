import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    Pressable,
    Text,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { VideoView, useVideoPlayer } from 'expo-video'

import { ApiError, getVideos, type ExerciseVideo } from '../lib/api'
import { getStoredToken } from '../lib/auth'
import { useActiveTheme } from '../stores/themeStore'

export default function ExerciseLibraryScreen() {
    const theme = useActiveTheme()
    const c = theme.colors
    const [videos, setVideos] = useState<ExerciseVideo[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedVideo, setSelectedVideo] = useState<ExerciseVideo | null>(null)

    const loadVideos = useCallback(async (isRefresh = false) => {
        try {
            setError(null)
            if (!isRefresh) setIsLoading(true)
            const token = await getStoredToken()
            if (!token) return
            const data = await getVideos(token)
            setVideos(data)
        } catch (err) {
            setError(err instanceof ApiError ? err.getErrorMessage() : 'Failed to load videos')
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    useEffect(() => {
        loadVideos()
    }, [loadVideos])

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true)
        loadVideos(true)
    }, [loadVideos])

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: c.surface }}>
            <View className="flex-1 px-6">
                <View className="pt-4 pb-6">
                    <Text
                        className="text-[34px] font-bold tracking-tight"
                        style={{ color: c.label }}
                    >
                        Library
                    </Text>
                </View>

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color={c.accent} />
                    </View>
                ) : error ? (
                    <View className="flex-1 items-center justify-center px-4">
                        <Text className="text-[15px] text-center" style={{ color: c.accent }}>
                            {error}
                        </Text>
                        <Pressable
                            className="mt-4 active:opacity-80"
                            onPress={() => loadVideos()}
                            accessibilityRole="button"
                            accessibilityLabel="Retry loading videos"
                        >
                            <Text className="text-[15px] font-medium" style={{ color: c.accent }}>
                                Retry
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    <FlatList
                        data={videos}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 32 }}
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        ListHeaderComponent={() => (
                            <View className="mb-6">
                                <View className="flex-row items-center" style={{ gap: 12 }}>
                                    <Text
                                        className="text-[13px] font-semibold uppercase tracking-wide"
                                        style={{ color: c.labelTertiary }}
                                    >
                                        Videos
                                    </Text>
                                    <View
                                        className="flex-1"
                                        style={{
                                            height: 1,
                                            backgroundColor: c.border,
                                        }}
                                    />
                                    {videos.length > 0 && (
                                        <View
                                            className="rounded-full px-2.5 py-0.5"
                                            style={{ backgroundColor: c.surfaceSecondary }}
                                        >
                                            <Text
                                                className="text-[12px] font-medium"
                                                style={{ color: c.labelSecondary }}
                                            >
                                                {videos.length} video{videos.length !== 1 ? 's' : ''}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={() => (
                            <View className="flex-1 items-center justify-center py-16">
                                <View
                                    className="size-14 items-center justify-center rounded-full"
                                    style={{ backgroundColor: c.surfaceSecondary }}
                                >
                                    <Ionicons
                                        name="videocam"
                                        size={24}
                                        color={c.labelTertiary}
                                    />
                                </View>
                                <Text
                                    className="mt-4 text-[15px] font-medium"
                                    style={{ color: c.label }}
                                >
                                    No videos yet
                                </Text>
                                <Text
                                    className="mt-1 text-[13px]"
                                    style={{ color: c.labelSecondary }}
                                >
                                    Exercise videos will appear here once uploaded
                                </Text>
                            </View>
                        )}
                        ItemSeparatorComponent={() => <View className="h-3" />}
                        renderItem={({ item }) => (
                            <Pressable
                                onPress={() => setSelectedVideo(item)}
                                className="rounded-[16px] p-4 active:opacity-80 flex-row items-center"
                                style={{ backgroundColor: c.surfaceSecondary }}
                                accessibilityRole="button"
                                accessibilityLabel={`Watch ${item.exerciseName} video`}
                            >
                                {item.thumbnailUrl ? (
                                    <Image
                                        source={{ uri: item.thumbnailUrl }}
                                        className="rounded-lg"
                                        style={{
                                            width: 72,
                                            height: 40,
                                            backgroundColor: c.border,
                                        }}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View
                                        className="rounded-lg items-center justify-center"
                                        style={{
                                            width: 72,
                                            height: 40,
                                            backgroundColor: c.surface,
                                        }}
                                    >
                                        <Ionicons
                                            name="videocam"
                                            size={18}
                                            color={c.labelTertiary}
                                        />
                                    </View>
                                )}
                                <View className="flex-1 ml-3 justify-center">
                                    <View className="flex-row items-center" style={{ gap: 4 }}>
                                        <Text
                                            className="text-[15px] font-semibold"
                                            numberOfLines={1}
                                            style={{ color: c.label }}
                                        >
                                            {item.exerciseName}
                                        </Text>
                                        <Ionicons
                                            name="play"
                                            size={12}
                                            color={c.labelSecondary}
                                        />
                                    </View>
                                    <Text
                                        className="text-[13px] mt-0.5"
                                        style={{ color: c.labelSecondary }}
                                    >
                                        {formatDate(item.createdAt)}
                                    </Text>
                                </View>
                                <Ionicons
                                    name="chevron-forward"
                                    size={15}
                                    color={c.labelTertiary}
                                />
                            </Pressable>
                        )}
                    />
                )}
            </View>

            <VideoPlayerModal
                video={selectedVideo}
                onClose={() => setSelectedVideo(null)}
            />
        </SafeAreaView>
    )
}

function VideoPlayerModal({
    video,
    onClose,
}: {
    video: ExerciseVideo | null
    onClose: () => void
}) {
    const viewRef = useRef<VideoView>(null)
    const player = useVideoPlayer(null)

    useEffect(() => {
        if (video) {
            player.replaceAsync(video.videoUrl).then(() => {
                player.play()
            })
        } else {
            player.pause()
            player.replaceAsync(null)
        }
    }, [video, player])

    useEffect(() => {
        if (!video) return
        const timer = setTimeout(() => {
            viewRef.current?.enterFullscreen()
        }, 300)
        return () => clearTimeout(timer)
    }, [video])

    function handleClose() {
        player.pause()
        player.replaceAsync(null)
        onClose()
    }

    if (!video) return null

    return (
        <Modal
            visible={!!video}
            animationType="fade"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <View className="flex-1" style={{ backgroundColor: '#000' }}>
                <VideoView
                    ref={viewRef}
                    player={player}
                    style={{ flex: 1 }}
                    nativeControls
                    onFullscreenExit={handleClose}
                />
            </View>
        </Modal>
    )
}
