'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { UploadIcon, XIcon, FileVideoIcon, VideoIcon, PlayIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ExerciseNameInput, useExerciseNames } from '@/components/exercise-name-input'
import { uploadVideo, getVideos, deleteVideo, type ExerciseVideo } from '@/lib/api'

export function VideoUploadForm() {
    const exerciseNames = useExerciseNames()
    const [exerciseName, setExerciseName] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [videos, setVideos] = useState<ExerciseVideo[]>([])
    const [loadingVideos, setLoadingVideos] = useState(true)
    const [dragOver, setDragOver] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const loadVideos = useCallback(async () => {
        setLoadingVideos(true)
        try {
            const data = await getVideos()
            setVideos(data)
        } catch {
            setVideos([])
        } finally {
            setLoadingVideos(false)
        }
    }, [])

    useEffect(() => {
        loadVideos()
    }, [loadVideos])

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault()
        setDragOver(true)
    }

    function handleDragLeave(e: React.DragEvent) {
        e.preventDefault()
        setDragOver(false)
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        setDragOver(false)
        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile && droppedFile.type.startsWith('video/')) {
            setFile(droppedFile)
        } else {
            toast.error('Please drop a video file')
        }
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = e.target.files?.[0]
        if (selected) setFile(selected)
    }

    function clearFile() {
        setFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    async function handleUpload() {
        if (!exerciseName.trim() || !file) return
        setUploading(true)
        try {
            const uploaded = await uploadVideo(exerciseName.trim(), file)
            toast.success('Video uploaded')
            setVideos((prev) => [uploaded, ...prev])
            setExerciseName('')
            clearFile()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to upload video')
        } finally {
            setUploading(false)
        }
    }

    async function handleDelete(videoId: string) {
        setDeletingId(videoId)
        try {
            await deleteVideo(videoId)
            setVideos((prev) => prev.filter((v) => v.id !== videoId))
            toast.success('Video deleted')
        } catch {
            toast.error('Failed to delete video')
        } finally {
            setDeletingId(null)
        }
    }

    const groupedVideos = videos.reduce(
        (acc, v) => {
            ;(acc[v.exerciseName] ??= []).push(v)
            return acc
        },
        {} as Record<string, ExerciseVideo[]>,
    )

    return (
        <div className="space-y-10">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <VideoIcon className="size-5" />
                        Upload Exercise Video
                    </CardTitle>
                    <CardDescription>
                        Upload demonstration videos for exercises. These videos are available to all
                        users.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="exercise_name">Exercise Name</Label>
                        <ExerciseNameInput
                            value={exerciseName}
                            onChange={setExerciseName}
                            suggestions={exerciseNames}
                            placeholder="Search exercise..."
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Video File</Label>
                        {file ? (
                            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3.5">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                                    <FileVideoIcon className="size-5 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                                    </p>
                                </div>
                                <Badge variant="secondary" className="shrink-0">
                                    {file.type.split('/')[1]?.toUpperCase() ?? 'VIDEO'}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={clearFile}
                                    type="button"
                                >
                                    <XIcon className="size-3.5" />
                                </Button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    'flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-12 transition-all duration-150',
                                    dragOver
                                        ? 'border-primary bg-primary/5 scale-[1.01]'
                                        : 'border-border hover:border-muted-foreground/30 hover:bg-muted/20',
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex size-14 items-center justify-center rounded-full transition-colors',
                                        dragOver ? 'bg-primary/10' : 'bg-muted',
                                    )}
                                >
                                    <UploadIcon
                                        className={cn(
                                            'size-6 transition-colors',
                                            dragOver
                                                ? 'text-primary'
                                                : 'text-muted-foreground',
                                        )}
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium">
                                        {dragOver ? 'Drop to upload' : 'Drop video here or click to browse'}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        MP4, WebM, MOV &middot; Up to 500 MB
                                    </p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="video/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </button>
                        )}
                    </div>

                    <Button
                        onClick={handleUpload}
                        disabled={!exerciseName.trim() || !file || uploading}
                        className="w-full"
                        size="lg"
                    >
                        {uploading ? (
                            <>
                                <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <UploadIcon className="size-4" />
                                Upload Video
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            <div>
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Uploaded Videos
                    </h2>
                    <Separator className="flex-1" />
                    {videos.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            {videos.length} video{videos.length !== 1 ? 's' : ''}
                        </Badge>
                    )}
                </div>

                <div className="mt-6">
                    {loadingVideos ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Card key={i} size="sm">
                                    <Skeleton className="aspect-video w-full rounded-t-lg" />
                                    <CardContent className="space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : videos.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                                    <VideoIcon className="size-6 text-muted-foreground/50" />
                                </div>
                                <p className="mt-4 text-sm font-medium">No videos uploaded yet</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Upload your first exercise demonstration video above
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedVideos).map(
                                ([exercise, exerciseVideos]) => (
                                    <div key={exercise}>
                                        <h3 className="mb-3 text-sm font-medium">{exercise}</h3>
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {exerciseVideos.map((video) => (
                                                <Card
                                                    key={video.id}
                                                    size="sm"
                                                    className="group overflow-hidden transition-shadow hover:shadow-md"
                                                >
                                                    <div className="relative aspect-video bg-muted">
                                                        {video.thumbnailUrl ? (
                                                            <img
                                                                src={video.thumbnailUrl}
                                                                alt={video.exerciseName}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full items-center justify-center">
                                                                <FileVideoIcon className="size-10 text-muted-foreground/30" />
                                                            </div>
                                                        )}
                                                        <a
                                                            href={video.videoUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/30 group-hover:opacity-100"
                                                        >
                                                            <div className="flex size-10 items-center justify-center rounded-full bg-white/90 shadow-lg">
                                                                <PlayIcon className="size-4 fill-black text-black" />
                                                            </div>
                                                        </a>
                                                    </div>
                                                    <CardContent className="flex items-center justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="truncate text-xs text-muted-foreground">
                                                                {new Date(
                                                                    video.createdAt,
                                                                ).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric',
                                                                })}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            disabled={deletingId === video.id}
                                                            className="shrink-0 text-muted-foreground/40 hover:text-destructive"
                                                            onClick={() =>
                                                                handleDelete(video.id)
                                                            }
                                                        >
                                                            <XIcon className="size-3" />
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
