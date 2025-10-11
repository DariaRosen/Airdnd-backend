import express from 'express'

import { login, signup, logout, loginWithPhone  } from './auth.controller.js'

const router = express.Router()

router.post('/login', login)
router.post('/signup', signup)
router.post('/login-phone', loginWithPhone)
router.post('/logout', logout)

const authRoutes = router
export default authRoutes