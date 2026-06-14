'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { UploadIcon, XIcon, FileVideoIcon, VideoIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { ExerciseNameInput, useExerciseNames } from '@/components/exercise-name-input'
import { uploadVideo, getVideos, deleteVideo, type ExerciseVideo } from '@/lib/api'
import { EditVideoDialog } from '@/components/edit-video-dialog'
import { VideoPlayerDialog } from '@/components/video-player-dialog'

export function VideoUploadForm() {
    const exerciseNames = useExerciseNames()
    const [exerciseName, setExerciseName] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [videos, setVideos] = useState<ExerciseVideo[]>([])
    const [loadingVideos, setLoadingVideos] = useState(true)
    const [dragOver, setDragOver] = useState(false)
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

    function handleUpdated(updated: ExerciseVideo) {
        setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
    }

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
                        <Label htmlFor="exercise_name">Exercise</Label>
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
                                            dragOver ? 'text-primary' : 'text-muted-foreground',
                                        )}
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium">
                                        {dragOver
                                            ? 'Drop to upload'
                                            : 'Drop video here or click to browse'}
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
                                Upload
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Thumbnail</TableHead>
                                    <TableHead>Exercise</TableHead>
                                    <TableHead>Uploaded</TableHead>
                                    <TableHead className="w-20">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <Skeleton className="aspect-video w-12 rounded" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-4 w-36" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-3 w-24" />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-0.5">
                                                <Skeleton className="h-6 w-6 rounded" />
                                                <Skeleton className="h-6 w-6 rounded" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Thumbnail</TableHead>
                                    <TableHead>Exercise</TableHead>
                                    <TableHead>Uploaded</TableHead>
                                    <TableHead className="w-20">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {videos.map((video) => (
                                    <TableRow key={video.id}>
                                        <TableCell>
                                            {video.thumbnailUrl ? (
                                                <HoverCard openDelay={200} closeDelay={100}>
                                                    <HoverCardTrigger asChild>
                                                        <img
                                                            src={video.thumbnailUrl}
                                                            alt={video.exerciseName}
                                                            className="aspect-video w-12 rounded object-cover cursor-pointer"
                                                        />
                                                    </HoverCardTrigger>
                                                    <HoverCardContent
                                                        side="top"
                                                        className="w-96 p-2"
                                                    >
                                                        <img
                                                            src={video.thumbnailUrl}
                                                            alt={video.exerciseName}
                                                            className="aspect-video w-full rounded object-cover"
                                                        />
                                                    </HoverCardContent>
                                                </HoverCard>
                                            ) : (
                                                <div className="flex aspect-video w-12 items-center justify-center rounded bg-muted">
                                                    <FileVideoIcon className="size-4 text-muted-foreground/30" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <VideoPlayerDialog video={video} />
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(video.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-0.5">
                                                <EditVideoDialog
                                                    video={video}
                                                    onUpdated={handleUpdated}
                                                />
                                                <AlertDialog>
                                                    <AlertDialogTrigger className="relative z-10 cursor-pointer text-muted-foreground/40 hover:text-destructive">
                                                        <XIcon className="size-3" />
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>
                                                                Delete Video
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete the
                                                                &quot;{video.exerciseName}&quot;
                                                                video? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                Cancel
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                variant="destructive"
                                                                onClick={async () => {
                                                                    try {
                                                                        await deleteVideo(video.id)
                                                                        setVideos((prev) =>
                                                                            prev.filter(
                                                                                (v) =>
                                                                                    v.id !==
                                                                                    video.id,
                                                                            ),
                                                                        )
                                                                        toast.success(
                                                                            'Video deleted',
                                                                        )
                                                                    } catch {
                                                                        toast.error(
                                                                            'Failed to delete video',
                                                                        )
                                                                    }
                                                                }}
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </div>
        </div>
    )
}
