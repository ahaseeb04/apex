'use client'

import { useState } from 'react'
import { PlayIcon } from 'lucide-react'
import { VisuallyHidden as VisuallyHiddenPrimitive } from 'radix-ui'
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { type ExerciseVideo } from '@/lib/api'

interface VideoPlayerDialogProps {
    video: ExerciseVideo
}

export function VideoPlayerDialog({ video }: VideoPlayerDialogProps) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="inline-flex items-center gap-1.5 cursor-pointer hover:underline">
                    {video.exerciseName}
                    <PlayIcon className="size-3 text-muted-foreground" />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl p-0 overflow-hidden" showCloseButton>
                <VisuallyHiddenPrimitive.Root>
                    <DialogTitle>{video.exerciseName}</DialogTitle>
                </VisuallyHiddenPrimitive.Root>
                <video
                    src={video.videoUrl}
                    controls
                    className="aspect-video w-full"
                    preload="metadata"
                    autoPlay
                />
            </DialogContent>
        </Dialog>
    )
}
