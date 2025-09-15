import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { ObjectId } from 'mongodb'

export const reviewService = {
  add,
  getById,
  update,
  remove,
  query
}

function _buildCriteria(filterBy = {}) {
  const criteria = {}
  if (filterBy.txt) criteria.comment = { $regex: filterBy.txt, $options: 'i' }

  if (filterBy.userId) criteria.user_id = String(filterBy.userId)
  if (filterBy.homeId) criteria.home_id = String(filterBy.homeId)

  if (typeof filterBy.minRating === 'number' || typeof filterBy.maxRating === 'number') {
    criteria.rating = {}
    if (typeof filterBy.minRating === 'number') criteria.rating.$gte = filterBy.minRating
    if (typeof filterBy.maxRating === 'number') criteria.rating.$lte = filterBy.maxRating
  }
  return criteria
}

function _sanitizeOut(doc) {
  if (!doc) return null
  return {
    ...doc,
    createdAt: typeof doc.createdAt === 'number'
      ? doc.createdAt
      : doc._id?.getTimestamp?.()?.getTime?.() || Date.now()
  }
}

function _validateReviewFields(r) {
  if (typeof r.user_id !== 'string' || !r.user_id.trim()) throw new Error('bad user_id')
  if (typeof r.home_id !== 'string' || !r.home_id.trim()) throw new Error('bad home_id')
  const n = Number(r.rating)
  if (!Number.isFinite(n) || n < 0 || n > 5) throw new Error('bad rating')
}

async function query(filterBy = {}) {
  const page = Math.max(+filterBy.page || 1, 1)
  const limit = Math.min(Math.max(+filterBy.limit || 20, 1), 100)
  const sortBy = filterBy.sortBy || 'createdAt'
  const sortDir = filterBy.sortDir === 'asc' ? 1 : -1

  const criteria = _buildCriteria(filterBy)
  const sort = sortBy === 'rating'
    ? { rating: sortDir, _id: -1 }
    : { createdAt: sortDir === 1 ? 1 : -1, _id: -1 }

  try {
    const collection = await dbService.getCollection('review')
    const cursor = collection.find(criteria).sort(sort).skip((page - 1) * limit).limit(limit)
    const [items, total] = await Promise.all([
      cursor.toArray(),
      collection.countDocuments(criteria)
    ])
    return {
      items: items.map(_sanitizeOut),
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  } catch (err) {
    logger.error('cannot find reviews', err)
    throw err
  }
}

async function getById(homeId) {
  try {
    if (!homeId) return []
    const collection = await dbService.getCollection('review')
    const reviews = await collection.find({ home_id: String(homeId) }).toArray()
    return reviews.map(_sanitizeOut)
  } catch (err) {
    logger.error(`while finding reviews by homeId: ${homeId}`, err)
    throw err
  }
}

async function add(review) {
  try {
    _validateReviewFields(review)
    const doc = {
      user_id: String(review.user_id),   
      home_id: String(review.home_id),  
      comment: typeof review.comment === 'string' ? review.comment.trim() : '',
      rating: Number(review.rating),
      createdAt: typeof review.createdAt === 'number' ? review.createdAt : Date.now()
    }
    const collection = await dbService.getCollection('review')
    const res = await collection.insertOne(doc) // ← רק _id של review הוא ObjectId
    const saved = await collection.findOne({ _id: res.insertedId })
    return _sanitizeOut(saved)
  } catch (err) {
    logger.error('cannot add review', err)
    throw err
  }
}

async function update(review) {
  try {
    const _id = ObjectId.isValid(review._id) ? new ObjectId(review._id) : null
    if (!_id) throw new Error('bad id')

    const set = {}
    if (typeof review.comment === 'string') set.comment = review.comment.trim()
    if (review.rating !== undefined) {
      const n = Number(review.rating)
      if (!Number.isFinite(n) || n < 0 || n > 5) throw new Error('bad rating')
      set.rating = n
    }

    const collection = await dbService.getCollection('review')
    await collection.updateOne({ _id }, { $set: set })
    const updated = await collection.findOne({ _id })
    return _sanitizeOut(updated)
  } catch (err) {
    logger.error(`cannot update review ${review._id}`, err)
    throw err
  }
}

async function remove(reviewId) {
  try {
    const _id = ObjectId.isValid(reviewId) ? new ObjectId(reviewId) : null
    if (!_id) throw new Error('bad id')
    const collection = await dbService.getCollection('review')
    await collection.deleteOne({ _id })
  } catch (err) {
    logger.error(`cannot remove review ${reviewId}`, err)
    throw err
  }
}
