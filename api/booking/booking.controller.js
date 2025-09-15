import { bookingService } from './booking.service.js'
import { logger } from '../../services/logger.service.js'
import { ObjectId } from 'mongodb'

export async function getBooking(req, res) {
  try {
    const { id } = req.params
    if (!ObjectId.isValid(id)) return res.status(400).send({ err: 'bad id' })

    const booking = await bookingService.getById(id)
    if (!booking) return res.status(404).send({ err: 'booking not found' })

    res.status(200).send(booking)
  } catch (err) {
    logger.error('Failed to get booking', err)
    res.status(500).send({ err: 'server error' })
  }
}

export async function getBookings(req, res) {
  try {
    const page = Math.max(+req.query.page || 1, 1)
    const limit = Math.min(Math.max(+req.query.limit || 20, 1), 100)

    const filterBy = {
      homeId: req.query.homeId || '',
      hostId: req.query.hostId || '',
      guestId: req.query.guestId || '',
      status: req.query.status || '',
      checkIn: req.query.checkIn || '',
      checkOut: req.query.checkOut || '',
      sortBy: req.query.sortBy || 'createdAt', // 'createdAt' | 'checkIn'
      sortDir: req.query.sortDir === 'asc' ? 'asc' : 'desc',
      page,
      limit
    }

    const data = await bookingService.query(filterBy)
    res.status(200).send(data)
  } catch (err) {
    logger.error('Failed to get bookings', err)
    res.status(500).send({ err: 'server error' })
  }
}

export async function addBooking(req, res) {
  try {
    const saved = await bookingService.add(req.body)
    res.status(201).send(saved)
  } catch (err) {
    logger.error('Failed to add booking', err)
    res.status(400).send({ err: err.message || 'bad data' })
  }
}

export async function updateBooking(req, res) {
  try {
    const { id } = req.params
    if (!ObjectId.isValid(id)) return res.status(400).send({ err: 'bad id' })

    const saved = await bookingService.update({ ...req.body, _id: id })
    if (!saved) return res.status(404).send({ err: 'booking not found' })

    res.status(200).send(saved)
  } catch (err) {
    logger.error('Failed to update booking', err)
    res.status(400).send({ err: err.message || 'bad data' })
  }
}

export async function deleteBooking(req, res) {
  try {
    const { id } = req.params
    if (!ObjectId.isValid(id)) return res.status(400).send({ err: 'bad id' })

    await bookingService.remove(id)
    res.status(204).end()
  } catch (err) {
    logger.error('Failed to delete booking', err)
    res.status(500).send({ err: 'server error' })
  }
}
