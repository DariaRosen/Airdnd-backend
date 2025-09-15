import express from 'express'
import { requireAuth, requireAdmin } from '../../middlewares/requireAuth.middleware.js'
import { getReview, getReviews, addReview, updateReview, deleteReview } from './review.controller.js'
import { log } from '../../middlewares/logger.middleware.js'

const router = express.Router()

router.get('/', log, getReviews)
router.get('/:id', log, getReview)
router.post('/', log, requireAuth, addReview)
router.put('/:id', requireAuth, updateReview)
router.delete('/:id', requireAuth, requireAdmin, deleteReview)

const reviewRoutes = router
export default reviewRoutes
