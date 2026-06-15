import cors from 'cors'
import express from 'express'

import { authRouter } from './routes/auth.js'
import { exerciseRouter } from './routes/exercises.js'
import { programRouter } from './routes/programs.js'
import { userRouter } from './routes/users.js'
import { videoRouter } from './routes/videos.js'
import { weekRouter } from './routes/weeks.js'

export function createApp() {
    const app = express()

    app.use(cors())
    app.use(express.json())

    app.use('/api/auth', authRouter)
    app.use('/api/programs', programRouter)
    app.use('/api/exercises', exerciseRouter)
    app.use('/api/users', userRouter)
    app.use('/api/videos', videoRouter)
    app.use('/api/weeks', weekRouter)

    return app
}
