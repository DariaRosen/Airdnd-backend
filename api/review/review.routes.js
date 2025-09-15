import express from 'express'
import { requireAuth, requireAdmin } from '../../middlewares/requireAuth.middleware.js'
import { getReview, getReviews, addReview, updateReview, deleteReview } from './review.controller.js'
import { log } from '../../middlewares/logger.middleware.js'

const router = express.Router()

router.get('/', log, getReviews)
router.get('/:id', log, getReview)
router.post('/', log, addReview)
router.put('/:id', updateReview)
router.delete('/:id', deleteReview)

const reviewRoutes = router
export default reviewRoutes
