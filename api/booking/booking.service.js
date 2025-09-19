// services/booking.service.js
import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { ObjectId } from 'mongodb'   // ← חדש

export const bookingService = {
  add,
  getById,
  update,
  remove,
  query,
}

const ALLOWED_STATUS = ['Pending', 'Paid', 'Cancelled', 'Completed']

const toId = str => ObjectId.createFromHexString(str) // ← כמו home

const toTs = d => {
  const ts = Date.parse(d)
  return Number.isFinite(ts) ? ts : null
}

const nightsBetween = (inTs, outTs) => {
  const MS = 24 * 60 * 60 * 1000
  return Math.max(1, Math.round((outTs - inTs) / MS))
}

const computeTotal = b => {
  const inTs = toTs(b.checkIn)
  const outTs = toTs(b.checkOut)
  const nights = nightsBetween(inTs, outTs)
  const base = nights * Number(b.pricePerNight)
  const afterDiscount = base * (1 - Number(b.discount ?? 0))
  const tax = Number(b.tax ?? 0)
  const totalPrice = Number.isFinite(Number(b.totalPrice))
    ? Number(b.totalPrice)
    : Math.round((afterDiscount + tax) * 100) / 100
  return { inTs, outTs, totalPrice }
}

const validate = b => {
  if (typeof b.home_id !== 'string' || !b.home_id) throw new Error('bad home_id')
  if (typeof b.guest_id !== 'string' || !b.guest_id) throw new Error('bad guest_id')
  if (typeof b.host_id !== 'string' || !b.host_id) throw new Error('bad host_id')

  const inTs = toTs(b.checkIn)
  const outTs = toTs(b.checkOut)
  if (!inTs || !outTs || outTs <= inTs) throw new Error('bad dates')

  const p = Number(b.pricePerNight)
  if (!Number.isFinite(p) || p < 0) throw new Error('bad pricePerNight')

  const discount = Number(b.discount ?? 0)
  if (!Number.isFinite(discount) || discount < 0 || discount > 1) throw new Error('bad discount')

  const tax = Number(b.tax ?? 0)
  if (!Number.isFinite(tax) || tax < 0) throw new Error('bad tax')

  if (b.status && !ALLOWED_STATUS.includes(b.status)) throw new Error('bad status')
}

const sanitizeOut = doc => {
  if (!doc) return null
  return {
    ...doc,
    createdAt: typeof doc.createdAt === 'number'
      ? doc.createdAt
      : doc._id?.getTimestamp?.()?.getTime?.() || Date.now()
  }
}

const buildCriteria = f => {
  const c = {}
  if (f?.homeId) c.home_id = f.homeId
  if (f?.guestId) c.guest_id = f.guestId
  if (f?.hostId) c.host_id = f.hostId
  if (f?.status) c.status = f.status

  const inTs = toTs(f?.checkIn)
  const outTs = toTs(f?.checkOut)
  if (inTs && outTs && outTs > inTs) {
    c.$and = [{ checkInAt: { $lt: outTs } }, { checkOutAt: { $gt: inTs } }]
  }
  return c
}

async function query(filterBy = {}) {
  const sortBy = filterBy.sortBy || 'createdAt'
  const sortDir = filterBy.sortDir === 'asc' ? 1 : -1

  const criteria = buildCriteria(filterBy)
  const sort = sortBy === 'checkIn'
    ? { checkInAt: sortDir, _id: -1 }
    : { createdAt: sortDir === 1 ? 1 : -1, _id: -1 }

  try {
    const col = await dbService.getCollection('booking')
    const cursor = col.find(criteria).sort(sort)

    const [items, total] = await Promise.all([
      cursor.toArray(),
      col.countDocuments(criteria)
    ])

    return {
      items: items.map(sanitizeOut),
      page: 1,
      limit: total, // no real limit, return everything
      total,
      pages: 1
    }
  } catch (err) {
    logger.error('cannot find bookings', err)
    throw err
  }
}


async function getById(id) {
  try {
    const col = await dbService.getCollection('booking')
    const booking = await col.findOne({ _id: toId(id) }) // ← בלי dbService.toObjectId
    return sanitizeOut(booking)
  } catch (err) {
    logger.error(`while finding booking ${id}`, err)
    throw err
  }
}

async function add(booking) {
  try {
    validate(booking)
    const { inTs, outTs, totalPrice } = computeTotal(booking)

    const doc = {
      home_id: booking.home_id,
      guest_id: booking.guest_id,
      host_id: booking.host_id,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      checkInAt: inTs,
      checkOutAt: outTs,
      pricePerNight: Number(booking.pricePerNight),
      discount: Number(booking.discount ?? 0),
      tax: Number(booking.tax ?? 0),
      totalPrice,
      status: booking.status || 'Pending',
      createdAt: typeof booking.createdAt === 'number' ? booking.createdAt : Date.now()
    }

    const col = await dbService.getCollection('booking')
    const res = await col.insertOne(doc)
    const saved = await col.findOne({ _id: res.insertedId })
    return sanitizeOut(saved)
  } catch (err) {
    logger.error('cannot add booking', err)
    throw err
  }
}

async function update(booking) {
  try {
    const _id = toId(booking._id) // ← כמו home
    const set = {}

    if (typeof booking.status === 'string') set.status = booking.status

    if (
      booking.checkIn !== undefined ||
      booking.checkOut !== undefined ||
      booking.pricePerNight !== undefined ||
      booking.discount !== undefined ||
      booking.tax !== undefined
    ) {
      const { inTs, outTs, totalPrice } = computeTotal({
        checkIn: booking.checkIn ?? booking._checkInFallback,
        checkOut: booking.checkOut ?? booking._checkOutFallback,
        pricePerNight: booking.pricePerNight ?? booking._ppnFallback,
        discount: booking.discount ?? booking._discFallback,
        tax: booking.tax ?? booking._taxFallback
      })
      if (booking.checkIn !== undefined) { set.checkIn = booking.checkIn, set.checkInAt = inTs }
      if (booking.checkOut !== undefined) { set.checkOut = booking.checkOut, set.checkOutAt = outTs }
      if (booking.pricePerNight !== undefined) set.pricePerNight = Number(booking.pricePerNight)
      if (booking.discount !== undefined) set.discount = Number(booking.discount)
      if (booking.tax !== undefined) set.tax = Number(booking.tax)
      if (booking.totalPrice === undefined) set.totalPrice = totalPrice
    }

    const col = await dbService.getCollection('booking')
    await col.updateOne({ _id }, { $set: set })
    const updated = await col.findOne({ _id })
    return sanitizeOut(updated)
  } catch (err) {
    logger.error(`cannot update booking ${booking._id}`, err)
    throw err
  }
}

async function remove(bookingId) {
  try {
    const _id = toId(bookingId) // ← כמו home
    const col = await dbService.getCollection('booking')
    await col.deleteOne({ _id })
    return bookingId
  } catch (err) {
    logger.error(`cannot remove booking ${bookingId}`, err)
    throw err
  }
}
