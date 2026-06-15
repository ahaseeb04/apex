import { Router } from 'express'
import { z } from 'zod'
import multer from 'multer'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { randomUUID } from 'node:crypto'
import { unlink, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { requireAuth } from '../middleware/auth.js'
import { prisma } from '../lib/prisma.js'
import { uploadToR2, deleteFromR2 } from '../lib/r2.js'

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

function extractKey(url: string): string {
    const { pathname } = new URL(url)
    const bucket = process.env.R2_BUCKET_NAME!
    const bucketPrefix = `/${bucket}/`

    if (pathname.startsWith(bucketPrefix)) {
        return pathname.slice(bucketPrefix.length)
    }

    return pathname.slice(1)
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
            res.status(500).json({ error: 'Failed to upload video' })
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

    const videoKey = extractKey(video.videoUrl)
    try {
        await deleteFromR2(videoKey)
    } catch {}

    if (video.thumbnailUrl) {
        const thumbnailKey = extractKey(video.thumbnailUrl)
        try {
            await deleteFromR2(thumbnailKey)
        } catch {}
    }

    await prisma.exerciseVideo.delete({
        where: { id: parsed.data.id },
    })

    res.json({ message: 'Video deleted' })
})

const imageUpload = multer({
    storage: multer.diskStorage({
        destination: tmpdir(),
        filename: (_req, _file, cb) => {
            cb(null, `${randomUUID()}.jpg`)
        },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true)
        } else {
            cb(new Error('Only image files are allowed'))
        }
    },
})

videoRouter.patch('/:id', requireAuth, (req, res, next) => {
    imageUpload.single('thumbnail')(req, res, async (err) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }

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

        const exerciseName = (req.body.exerciseName as string | undefined)?.trim()
        const thumbnailUrlBody = (req.body.thumbnailUrl as string | undefined)?.trim()
        const file = req.file

        if (!exerciseName && !file && !thumbnailUrlBody) {
            res.status(400).json({ error: 'No fields to update' })
            return
        }

        try {
            let thumbnailUrl = video.thumbnailUrl

            if (file) {
                const thumbBuffer = await readFile(file.path)
                const thumbKey = `thumbnails/${randomUUID()}.jpg`
                thumbnailUrl = await uploadToR2(thumbKey, thumbBuffer, 'image/jpeg')
                await unlink(file.path)

                if (video.thumbnailUrl) {
                    const oldKey = extractKey(video.thumbnailUrl)
                    try {
                        await deleteFromR2(oldKey)
                    } catch {}
                }
            } else if (thumbnailUrlBody) {
                let tempPath: string | null = null
                try {
                    const response = await fetch(thumbnailUrlBody)
                    if (!response.ok) {
                        res.status(400).json({ error: 'Failed to download thumbnail from URL' })
                        return
                    }
                    const contentType = response.headers.get('content-type') ?? ''
                    if (!contentType.startsWith('image/')) {
                        res.status(400).json({ error: 'URL does not point to an image' })
                        return
                    }
                    const buffer = Buffer.from(await response.arrayBuffer())
                    const ext = contentType.split('/')[1] ?? 'jpg'
                    tempPath = `${tmpdir()}/${randomUUID()}.${ext}`
                    await writeFile(tempPath, buffer)

                    const thumbBuffer = await readFile(tempPath)
                    const thumbKey = `thumbnails/${randomUUID()}.${ext}`
                    thumbnailUrl = await uploadToR2(thumbKey, thumbBuffer, contentType)
                } catch {
                    res.status(400).json({ error: 'Failed to download thumbnail from URL' })
                    return
                } finally {
                    if (tempPath) {
                        try { await unlink(tempPath) } catch {}
                    }
                }

                if (video.thumbnailUrl) {
                    const oldKey = extractKey(video.thumbnailUrl)
                    try {
                        await deleteFromR2(oldKey)
                    } catch {}
                }
            }

            const updated = await prisma.exerciseVideo.update({
                where: { id: parsed.data.id },
                data: {
                    ...(exerciseName ? { exerciseName } : {}),
                    thumbnailUrl,
                },
            })

            res.json(updated)
        } catch (e) {
            if (file) {
                try { await unlink(file.path) } catch {}
            }
            res.status(500).json({ error: 'Failed to update video' })
        }
    })
})
