'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { PencilIcon, UploadIcon, XIcon, LinkIcon, FileVideoIcon, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { ExerciseNameInput, useExerciseNames } from '@/components/exercise-name-input'
import { updateVideo, type ExerciseVideo } from '@/lib/api'
import { cn } from '@/lib/utils'

interface EditVideoDialogProps {
    video: ExerciseVideo
    onUpdated: (updated: ExerciseVideo) => void
}

export function EditVideoDialog({ video, onUpdated }: EditVideoDialogProps) {
    const exerciseNames = useExerciseNames()
    const [open, setOpen] = useState(false)
    const [exerciseName, setExerciseName] = useState(video.exerciseName)
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
    const [thumbnailUrl, setThumbnailUrl] = useState('')
    const [saving, setSaving] = useState(false)
    const [thumbnailMode, setThumbnailMode] = useState<'current' | 'upload' | 'url'>('current')
    const [dragOver, setDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

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
        if (droppedFile && droppedFile.type.startsWith('image/')) {
            setThumbnailFile(droppedFile)
        } else {
            toast.error('Please drop an image file')
        }
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const selected = e.target.files?.[0]
        if (selected) setThumbnailFile(selected)
    }

    function clearThumbnailFile() {
        setThumbnailFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    async function handleSave() {
        const trimmedName = exerciseName.trim()
        const trimmedUrl = thumbnailUrl.trim()
        const hasNameChange = trimmedName !== video.exerciseName
        const hasUpload = thumbnailMode === 'upload' && thumbnailFile !== null
        const hasUrl = thumbnailMode === 'url' && trimmedUrl.length > 0

        if (!hasNameChange && !hasUpload && !hasUrl) return

        setSaving(true)
        try {
            const updated = await updateVideo(video.id, {
                exerciseName: hasNameChange ? trimmedName : undefined,
                thumbnail: hasUpload ? thumbnailFile : undefined,
                thumbnailUrl: hasUrl ? trimmedUrl : undefined,
            })
            toast.success('Video updated')
            onUpdated(updated)
            setOpen(false)
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to update video')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon-xs" className="text-muted-foreground/40 hover:text-foreground">
                    <PencilIcon className="size-3" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Edit Video</DialogTitle>
                    <DialogDescription>
                        Change the exercise name or upload a custom thumbnail.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor={`edit-exercise-${video.id}`}>Exercise Name</Label>
                        <ExerciseNameInput
                            value={exerciseName}
                            onChange={setExerciseName}
                            suggestions={exerciseNames}
                            placeholder="Search exercise..."
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
                        />
                    </div>
                    <div className="overflow-hidden rounded-lg bg-muted">
                        <video
                            src={video.videoUrl}
                            controls
                            className="aspect-video w-full"
                            preload="metadata"
                        />
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Thumbnail</Label>
                            <div className="inline-flex rounded-md border border-border bg-muted p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setThumbnailMode('current')}
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors',
                                        thumbnailMode === 'current'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <ImageIcon className="size-3" />
                                    Current
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setThumbnailMode('upload')}
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors',
                                        thumbnailMode === 'upload'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <UploadIcon className="size-3" />
                                    Upload
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setThumbnailMode('url')}
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors',
                                        thumbnailMode === 'url'
                                            ? 'bg-background text-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    <LinkIcon className="size-3" />
                                    URL
                                </button>
                            </div>
                        </div>
                        {thumbnailMode === 'current' ? (
                            video.thumbnailUrl ? (
                                <img
                                    src={video.thumbnailUrl}
                                    alt={video.exerciseName}
                                    className="aspect-video w-full rounded-lg border object-cover"
                                />
                            ) : (
                                <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed bg-muted">
                                    <div className="text-center">
                                        <FileVideoIcon className="mx-auto size-8 text-muted-foreground/30" />
                                        <p className="mt-1 text-xs text-muted-foreground">No thumbnail set</p>
                                    </div>
                                </div>
                            )
                        ) : thumbnailMode === 'upload' ? (
                            thumbnailFile ? (
                                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3.5">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{thumbnailFile.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(thumbnailFile.size / 1024).toFixed(0)} KB
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        onClick={clearThumbnailFile}
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
                                        'flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 transition-all duration-150',
                                        dragOver
                                            ? 'border-primary bg-primary/5 scale-[1.01]'
                                            : 'border-border hover:border-muted-foreground/30 hover:bg-muted/20',
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'flex size-10 items-center justify-center rounded-full transition-colors',
                                            dragOver ? 'bg-primary/10' : 'bg-muted',
                                        )}
                                    >
                                        <UploadIcon
                                            className={cn(
                                                'size-4 transition-colors',
                                                dragOver
                                                    ? 'text-primary'
                                                    : 'text-muted-foreground',
                                            )}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {dragOver ? 'Drop to upload' : 'Drop image or click to browse'}
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </button>
                            )
                        ) : (
                            <Input
                                id={`edit-thumb-url-${video.id}`}
                                value={thumbnailUrl}
                                onChange={(e) => setThumbnailUrl(e.target.value)}
                                placeholder="https://example.com/thumbnail.jpg"
                            />
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={
                            saving ||
                            (exerciseName.trim() === video.exerciseName &&
                                (thumbnailMode === 'current'
                                    ? true
                                    : thumbnailMode === 'upload'
                                      ? !thumbnailFile
                                      : !thumbnailUrl.trim()))
                        }
                    >
                        {saving ? (
                            <>
                                <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
