import cors from 'cors'
import express from 'express'

import { authRouter } from './routes/auth'
import { exerciseRouter } from './routes/exercises'
import { programRouter } from './routes/programs'
import { weekRouter } from './routes/weeks'

export function createApp() {
    const app = express()

    app.use(cors())
    app.use(express.json())

    app.use('/api/auth', authRouter)
    app.use('/api/programs', programRouter)
    app.use('/api/exercises', exerciseRouter)
    app.use('/api/weeks', weekRouter)

    return app
}
