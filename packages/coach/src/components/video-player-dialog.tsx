'use client'

import { useState } from 'react'
import { PlayIcon } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
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
            <DialogContent className="sm:max-w-3xl" showCloseButton>
                <DialogHeader>
                    <DialogTitle>{video.exerciseName}</DialogTitle>
                </DialogHeader>
                <div className="overflow-hidden rounded-lg bg-muted">
                    <video
                        src={video.videoUrl}
                        controls
                        className="aspect-video w-full"
                        preload="metadata"
                        autoPlay
                    />
                </div>
            </DialogContent>
        </Dialog>
    )
}
