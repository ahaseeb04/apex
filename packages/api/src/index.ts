import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dirname, '../../../.env') })

import { createApp } from './app'

const app = createApp()

const port = process.env.PORT || 4000
app.listen(port, () => {
    console.log(`API server running on port ${port}`)
})
