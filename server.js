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
    credentials: true
  }))
}

app.use(setupAsyncLocalStorage)

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/home', homeRoutes)
app.use('/api/review', reviewRoutes)
app.use('/api/booking', bookingRoutes)

// סטטי תחת /Airdnd כדי להתאים ל-base
app.use('/Airdnd', express.static(path.join(__dirname, 'public')))

app.get('/api/health', (req, res) => res.send('ok'))

// SPA fallback רק לנתיבים בלי סיומת תחת /Airdnd
app.get(/^\/Airdnd(?!.*\.).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// שורש מפנה ל-/Airdnd
app.get('/', (req, res) => res.redirect('/Airdnd'))

const PORT = process.env.PORT || 3030
// server.listen(PORT, () => logger.info(`server on http://localhost:${PORT}/Airdnd`))
server.listen(PORT, () => {
  const base = process.env.NODE_ENV === 'production'
    ? 'https://airdnd-backend-w11x.onrender.com'
    : `http://localhost:${PORT}`
  logger.info(`✅ Server running on ${base}/Airdnd`)
})
