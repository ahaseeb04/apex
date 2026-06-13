import { Router } from 'express'
import { z } from 'zod'
import multer from 'multer'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { randomUUID } from 'node:crypto'
import { unlink, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { requireAuth } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { uploadToR2 } from '../lib/r2'

const execFileAsync = promisify(execFile)

export const videoRouter = Router()

const upload = multer({
    storage: multer.diskStorage({
        destination: tmpdir(),
        filename: (_req, file, cb) => {
            const ext = path.extname(file.originalname) || '.mp4'
            cb(null, `${randomUUID()}${ext}`)
        },
    }),
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true)
        } else {
            cb(new Error('Only video files are allowed'))
        }
    },
})

async function generateThumbnail(videoPath: string, outputPath: string): Promise<void> {
    await execFileAsync('ffmpeg', ['-i', videoPath, '-vframes', '1', '-q:v', '2', '-y', outputPath])
}

videoRouter.post('/', requireAuth, (req, res, next) => {
    upload.single('video')(req, res, async (err) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }

        const file = req.file
        if (!file) {
            res.status(400).json({ error: 'No video file provided' })
            return
        }

        const exerciseName = req.body.exercise_name as string | undefined
        if (!exerciseName || !exerciseName.trim()) {
            try {
                await unlink(file.path)
            } catch {}
            res.status(400).json({ error: 'exercise_name is required' })
            return
        }

        try {
            const videoKey = `videos/${randomUUID()}${path.extname(file.originalname) || '.mp4'}`
            const videoBuffer = await readFile(file.path)
            const videoUrl = await uploadToR2(videoKey, videoBuffer, file.mimetype)

            let thumbnailUrl: string | null = null
            const thumbnailPath = path.join(tmpdir(), `${randomUUID()}.jpg`)

            try {
                await generateThumbnail(file.path, thumbnailPath)
                const thumbBuffer = await readFile(thumbnailPath)
                const thumbKey = `thumbnails/${randomUUID()}.jpg`
                thumbnailUrl = await uploadToR2(thumbKey, thumbBuffer, 'image/jpeg')
                try {
                    await unlink(thumbnailPath)
                } catch {}
            } catch {
                thumbnailUrl = null
            }

            await unlink(file.path)

            const record = await prisma.exerciseVideo.create({
                data: {
                    exerciseName: exerciseName.trim(),
                    videoUrl,
                    thumbnailUrl,
                },
            })

            res.status(201).json(record)
        } catch (e) {
            try {
                await unlink(file.path)
            } catch {}
            res.status(500).json({ error: e })
        }
    })
})

videoRouter.get('/', requireAuth, async (req, res) => {
    const exerciseName = req.query.exerciseName as string | undefined

    const where = exerciseName
        ? { exerciseName: { contains: exerciseName, mode: 'insensitive' as const } }
        : {}

    const videos = await prisma.exerciseVideo.findMany({
        where,
        orderBy: { createdAt: 'desc' },
    })

    res.json(videos)
})

const deleteSchema = z.object({
    id: z.string(),
})

videoRouter.delete('/:id', requireAuth, async (req, res) => {
    const parsed = deleteSchema.safeParse({ id: req.params.id })
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid video id' })
        return
    }

    const video = await prisma.exerciseVideo.findUnique({
        where: { id: parsed.data.id },
    })

    if (!video) {
        res.status(404).json({ error: 'Video not found' })
        return
    }

    await prisma.exerciseVideo.delete({
        where: { id: parsed.data.id },
    })

    res.json({ message: 'Video deleted' })
})
