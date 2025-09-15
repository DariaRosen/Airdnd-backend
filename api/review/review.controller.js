import { reviewService } from './review.service.js'
import { logger } from '../../services/logger.service.js'
import { ObjectId } from 'mongodb'

export async function getReview(req, res) {
  try {
    const { id } = req.params  
    const reviews = await reviewService.getById(id)
    res.status(200).send(reviews)
  } catch (err) {
    logger.error('Failed to get reviews by homeId', err)
    res.status(500).send({ err: 'server error' })
  }
}

export async function getReviews(req, res) {
  try {
    const page = Math.max(+req.query.page || 1, 1)
    const limit = Math.min(Math.max(+req.query.limit || 20, 1), 100)

    const filterBy = {
      txt: (req.query.txt || '').toString(),
      userId: req.query.userId || '',
      homeId: req.query.homeId || '',
      minRating: req.query.minRating !== undefined ? +req.query.minRating : undefined,
      maxRating: req.query.maxRating !== undefined ? +req.query.maxRating : undefined,
      sortBy: req.query.sortBy || 'createdAt', // 'createdAt' | 'rating'
      sortDir: req.query.sortDir === 'asc' ? 'asc' : 'desc',
      page,
      limit
    }

    const data = await reviewService.query(filterBy)
    res.status(200).send(data)
  } catch (err) {
    logger.error('Failed to get reviews', err)
    res.status(500).send({ err: 'server error' })
  }
}

export async function addReview(req, res) {
  try {
    const saved = await reviewService.add(req.body)
    res.status(201).send(saved)
  } catch (err) {
    logger.error('Failed to add review', err)
    res.status(400).send({ err: err.message || 'bad data' })
  }
}

export async function updateReview(req, res) {
  try {
    const { id } = req.params
    if (!ObjectId.isValid(id)) return res.status(400).send({ err: 'bad id' })

    const saved = await reviewService.update({ ...req.body, _id: id })
    if (!saved) return res.status(404).send({ err: 'review not found' })

    res.status(200).send(saved)
  } catch (err) {
    logger.error('Failed to update review', err)
    res.status(400).send({ err: err.message || 'bad data' })
  }
}

export async function deleteReview(req, res) {
  try {
    const { id } = req.params
    if (!ObjectId.isValid(id)) return res.status(400).send({ err: 'bad id' })

    await reviewService.remove(id)
    res.status(204).end()
  } catch (err) {
    logger.error('Failed to delete review', err)
    res.status(500).send({ err: 'server error' })
  }
}
