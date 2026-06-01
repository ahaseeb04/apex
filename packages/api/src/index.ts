import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(import.meta.dirname, '../../../.env') })

import { createApp } from './app'

const app = createApp()

app.listen(4000, () => {
    console.log('API server running on http://localhost:4000')
})
