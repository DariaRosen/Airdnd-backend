import http from 'http'
import path from 'path'
import cors from 'cors'
import express from 'express'
import cookieParser from 'cookie-parser'
import { fileURLToPath } from 'url'

import authRoutes from './api/auth/auth.routes.js'
import userRoutes from './api/user/user.routes.js'
import homeRoutes from './api/homes/home.routes.js'
import reviewRoutes from './api/review/review.routes.js'
import bookingRoutes from './api/booking/booking.routes.js'
import { setupAsyncLocalStorage } from './middlewares/setupAls.middleware.js'
import { logger } from './services/logger.service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = http.createServer(app)

app.use(cookieParser())
app.use(express.json())

if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: [
      'http://127.0.0.1:8080',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://localhost:5173'
    ],
    credentials: false
  }))
}

app.all('/*all', setupAsyncLocalStorage)

// API
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/home', homeRoutes)
app.use('/api/review', reviewRoutes)
app.use('/api/booking', bookingRoutes)

// סטטי תחת prefix /Airdnd → קבצים מתוך public
app.use('/Airdnd', express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
  res.redirect('/Airdnd')
})

app.get(/^\/Airdnd(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

const port = process.env.PORT || 3030
server.listen(port, () => {
  logger.info('Server is running on: ' + `http://localhost:${port}/Airdnd`)
})
