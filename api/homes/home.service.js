import { ObjectId } from 'mongodb'
import { logger } from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'

const PAGE_SIZE = 12

export const homeService = {
  query,
  getById,
  add,
  update,
  remove,
  addHomeMsg,
  removeHomeMsg
}

async function query(filterBy = {}) {
  try {
    const criteria = _buildCriteria(filterBy)
    const sort = _buildSort(filterBy)
    const col = await dbService.getCollection('home')
    let cursor = col.find(criteria, { sort })
    if (filterBy.pageIdx !== undefined) cursor = cursor.skip(filterBy.pageIdx * PAGE_SIZE).limit(PAGE_SIZE)
    const homes = await cursor.toArray()
    return homes
  } catch (err) {
    logger.error('cannot find homes', err)
    throw err
  }
}

async function getById(homeId) {
  try {
    const col = await dbService.getCollection('home')
    const home = await col.findOne({ _id: ObjectId.createFromHexString(homeId) })
    if (!home) return null
    if (!home.createdAt && home._id?.getTimestamp) home.createdAt = home._id.getTimestamp().getTime()
    return home
  } catch (err) {
    logger.error(`while finding home ${homeId}`, err)
    throw err
  }
}

async function add(home) {
  try {
    const now = Date.now()
    const toInsert = {
      host_id: home.host_id,
      title: home.title,
      description: home.description || '',
      price: Number(home.price) || 0,
      capacity: Number(home.capacity) || 1,
      rooms: Number(home.rooms) || 1,
      beds: Number(home.beds) || 1,
      bathrooms: Number(home.bathrooms) || 1,
      type: home.type || 'house',
      imgUrls: home.imgUrls || [],
      rating: Number(home.rating) || 0,
      numberOfRaters: Number(home.numberOfRaters) || 0,
      addedToWishlist: Number(home.addedToWishlist) || 0,
      guestFavorite: Boolean(home.guestFavorite),
      location: home.location || {},
      amenities: home.amenities || [],
      highlights: home.highlights || {},
      msgs: home.msgs || [],
      unavailableDates: home.unavailableDates || [],
      lastSearchValue: home.lastSearchValue || '',
      createdAt: home.createdAt || now
    }
    const col = await dbService.getCollection('home')
    await col.insertOne(toInsert)
    return toInsert
  } catch (err) {
    logger.error('cannot insert home', err)
    throw err
  }
}

async function update(home) {
  try {
    const criteria = { _id: ObjectId.createFromHexString(home._id) }
    const toSet = {
      host_id: home.host_id,
      title: home.title,
      description: home.description,
      price: home.price,
      capacity: home.capacity,
      rooms: home.rooms,
      beds: home.beds,
      bathrooms: home.bathrooms,
      type: home.type,
      imgUrls: home.imgUrls,
      rating: home.rating,
      numberOfRaters: home.numberOfRaters,
      addedToWishlist: home.addedToWishlist,
      guestFavorite: home.guestFavorite,
      location: home.location,
      amenities: home.amenities,
      highlights: home.highlights,
      unavailableDates: home.unavailableDates,
      lastSearchValue: home.lastSearchValue
    }
    const col = await dbService.getCollection('home')
    await col.updateOne(criteria, { $set: toSet })
    return home
  } catch (err) {
    logger.error(`cannot update home ${home._id}`, err)
    throw err
  }
}

async function remove(homeId) {
  const { loggedinUser } = asyncLocalStorage.getStore() || {}
  const ownerId = loggedinUser?._id
  const isAdmin = loggedinUser?.isAdmin
  try {
    const criteria = { _id: ObjectId.createFromHexString(homeId) }
    if (!isAdmin && ownerId) criteria['host_id'] = ownerId
    const col = await dbService.getCollection('home')
    const res = await col.deleteOne(criteria)
    if (res.deletedCount === 0) throw 'Not your home'
    return homeId
  } catch (err) {
    logger.error(`cannot remove home ${homeId}`, err)
    throw err
  }
}

async function addHomeMsg(homeId, msg) {
  try {
    const criteria = { _id: ObjectId.createFromHexString(homeId) }
    const col = await dbService.getCollection('home')
    const msgToAdd = { id: makeId(), txt: msg.txt, by: msg.by, createdAt: Date.now() }
    await col.updateOne(criteria, { $push: { msgs: msgToAdd } })
    return msgToAdd
  } catch (err) {
    logger.error(`cannot add home msg ${homeId}`, err)
    throw err
  }
}

async function removeHomeMsg(homeId, msgId) {
  try {
    const criteria = { _id: ObjectId.createFromHexString(homeId) }
    const col = await dbService.getCollection('home')
    await col.updateOne(criteria, { $pull: { msgs: { id: msgId } } })
    return msgId
  } catch (err) {
    logger.error(`cannot remove home msg ${homeId}`, err)
    throw err
  }
}

function _buildCriteria(f = {}) {
  const txt = f.txt?.trim() || ''
  const regex = txt ? { $regex: txt, $options: 'i' } : undefined

  const criteria = {}
  if (regex) criteria.$or = [{ title: regex }, { description: regex }]
  if (f.type) criteria.type = f.type
  if (f.host_id) criteria.host_id = f.host_id
  if (f.capacity) criteria.capacity = { $gte: Number(f.capacity) }
  if (f.rooms) criteria.rooms = { $gte: Number(f.rooms) }
  if (f.beds) criteria.beds = { $gte: Number(f.beds) }
  if (f.bathrooms) criteria.bathrooms = { $gte: Number(f.bathrooms) }
  if (f.minPrice !== undefined || f.maxPrice !== undefined) {
    criteria.price = {}
    if (f.minPrice !== undefined) criteria.price.$gte = Number(f.minPrice)
    if (f.maxPrice !== undefined) criteria.price.$lte = Number(f.maxPrice)
  }
  if (f.ratingMin) criteria.rating = { $gte: Number(f.ratingMin) }
  if (Array.isArray(f.amenities) && f.amenities.length) criteria.amenities = { $all: f.amenities }
  if (f.guestFavorite !== undefined) criteria.guestFavorite = Boolean(f.guestFavorite)
  // דוגמה אם תרצה לפלטר לפי מדינה/עיר:
  if (f.country) criteria['location.country'] = f.country
  if (f.city) criteria['location.city'] = f.city

  return criteria
}

function _buildSort(f = {}) {
  if (!f.sortField) return {}
  const dir = f.sortDir === -1 ? -1 : 1
  return { [f.sortField]: dir }
}
