import { logger } from '../../services/logger.service.js'
import { homeService } from './home.service.js'

export async function getHomes(req, res) {
  try {
    const filterBy = {
      txt: req.query.txt || '',
      type: req.query.type || '',
      city: req.query.city || '',
      country: req.query.country || '',
      minPrice: req.query.minPrice !== undefined ? +req.query.minPrice : undefined
      ,maxPrice: req.query.maxPrice !== undefined ? +req.query.maxPrice : undefined
      ,capacity: req.query.capacity ? +req.query.capacity : undefined
      ,rooms: req.query.rooms ? +req.query.rooms : undefined
      ,beds: req.query.beds ? +req.query.beds : undefined
      ,bathrooms: req.query.bathrooms ? +req.query.bathrooms : undefined
      ,ratingMin: req.query.ratingMin ? +req.query.ratingMin : undefined
      ,amenities: req.query.amenities ? [].concat(req.query.amenities) : undefined
      ,guestFavorite: req.query.guestFavorite !== undefined ? req.query.guestFavorite === 'true' : undefined
      ,sortField: req.query.sortField || ''
      ,sortDir: req.query.sortDir ? +req.query.sortDir : 1
      ,pageIdx: req.query.pageIdx !== undefined ? +req.query.pageIdx : undefined
      ,host_id: req.query.host_id || ''
    }
    const homes = await homeService.query(filterBy)
    res.json(homes)
  } catch (err) {
    logger.error('Failed to get homes', err)
    res.status(400).send({ err: 'Failed to get homes' })
  }
}

export async function getHomeById(req, res) {
  try {
    const id = req.params.id
    const home = await homeService.getById(id)
    if (!home) return res.status(404).send({ err: 'Home not found' })
    res.json(home)
  } catch (err) {
    logger.error('Failed to get home', err)
    res.status(400).send({ err: 'Failed to get home' })
  }
}

export async function addHome(req, res) {
  const { loggedinUser, body } = req
  try {
    const home = {
      ...body,
      host_id: loggedinUser?._id || body.host_id
    }
    const added = await homeService.add(home)
    res.status(201).json(added)
  } catch (err) {
    logger.error('Failed to add home', err)
    res.status(400).send({ err: 'Failed to add home' })
  }
}

export async function updateHome(req, res) {
  const { loggedinUser, body } = req
  const userId = loggedinUser?._id
  const isAdmin = loggedinUser?.isAdmin

  try {
    const home = { ...body, _id: req.params.id }
    if (!isAdmin && String(home.host_id) !== String(userId)) {
      return res.status(403).send('Not your home...')
    }
    const updated = await homeService.update(home)
    res.json(updated)
  } catch (err) {
    logger.error('Failed to update home', err)
    res.status(400).send({ err: 'Failed to update home' })
  }
}

export async function removeHome(req, res) {
  try {
    const id = req.params.id
    const removedId = await homeService.remove(id)
    res.send(removedId)
  } catch (err) {
    logger.error('Failed to remove home', err)
    res.status(400).send({ err: 'Failed to remove home' })
  }
}

export async function addMsg(req, res) {
  const { loggedinUser } = req
  try {
    const id = req.params.id
    const msg = { txt: req.body.txt, by: loggedinUser }
    const saved = await homeService.addHomeMsg(id, msg)
    res.status(201).send(saved)
  } catch (err) {
    logger.error('Failed to add home msg', err)
    res.status(400).send({ err: 'Failed to add home msg' })
  }
}

export async function removeMsg(req, res) {
  try {
    const { id, msgId } = req.params
    const removedId = await homeService.removeHomeMsg(id, msgId)
    res.send(removedId)
  } catch (err) {
    logger.error('Failed to remove home msg', err)
    res.status(400).send({ err: 'Failed to remove home msg' })
  }
}
