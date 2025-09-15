import express from 'express'
import { requireAuth, requireAdmin } from '../../middlewares/requireAuth.middleware.js'
import { getBooking, getBookings, addBooking, updateBooking, deleteBooking } from './booking.controller.js'
import { log } from '../../middlewares/logger.middleware.js'

const router = express.Router()

router.get('/', log, getBookings)
router.get('/:id', log, getBooking)
router.post('/', log, requireAuth, addBooking)
router.put('/:id', requireAuth, updateBooking)
router.delete('/:id', requireAuth, requireAdmin, deleteBooking)

const bookingRoutes = router
export default bookingRoutes
