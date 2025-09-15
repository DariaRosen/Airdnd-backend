import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'

export const userService = {
  add,         // Create
  getById,     // Read
  update,      // Update
  remove,      // Delete
  query,       // List
  getByUsername
}

async function query(filterBy = {}) {
  const criteria = _buildCriteria(filterBy)
  try {
    const collection = await dbService.getCollection('user')
    const users = await collection
      .find(criteria, { projection: { password: 0, passwordHash: 0 } })
      .toArray()

    return users.map(u => ({
      ...u,
      createdAt: u._id?.getTimestamp?.() || new Date()
    }))
  } catch (err) {
    logger.error('cannot find users', err)
    throw err
  }
}

async function getById(userId) {
  try {
    if (!ObjectId.isValid(userId)) return null
    const _id = new ObjectId(userId)

    const collection = await dbService.getCollection('user')
    const user = await collection.findOne(
      { _id },
      { projection: { password: 0, passwordHash: 0 } }
    )
    return user
  } catch (err) {
    logger.error(`while finding user by id: ${userId}`, err)
    throw err
  }
}

async function getByUsername(username) {
  try {
    const collection = await dbService.getCollection('user')
    // שים לב: כאן לא מסתירים passwordHash כי לוגין צריך להשוות hash
    const user = await collection.findOne({ username })
    return user
  } catch (err) {
    logger.error(`while finding user by username: ${username}`, err)
    throw err
  }
}

async function remove(userId) {
  try {
    if (!ObjectId.isValid(userId)) throw new Error('bad id')
    const _id = new ObjectId(userId)

    const collection = await dbService.getCollection('user')
    await collection.deleteOne({ _id })
  } catch (err) {
    logger.error(`cannot remove user ${userId}`, err)
    throw err
  }
}

async function update(user) {
  try {
    if (!ObjectId.isValid(user._id)) throw new Error('bad id')
    const _id = new ObjectId(user._id)

    const set = {
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      favorites: Array.isArray(user.favorites) ? user.favorites : [],
      searching_history: Array.isArray(user.searching_history) ? user.searching_history : []
    }

    // עדכון תמונה: לא לדרוס אם לא נשלח, להסיר אם נשלח ריק
    const hasImg = typeof user.imgUrl === 'string'
    const ops = { $set: set }
    if (hasImg) {
      if (user.imgUrl.trim() === '') ops.$unset = { imgUrl: '' }
      else ops.$set.imgUrl = user.imgUrl
    }

    const collection = await dbService.getCollection('user')
    await collection.updateOne({ _id }, ops)

    const updated = await collection.findOne(
      { _id },
      { projection: { password: 0, passwordHash: 0 } }
    )
    return updated
  } catch (err) {
    logger.error(`cannot update user ${user._id}`, err)
    throw err
  }
}

async function add(user) {
  try {
    if (!user.password || typeof user.password !== 'string') {
      throw new Error('password required')
    }
    const passwordHash = await bcrypt.hash(user.password, 10)

    const userToAdd = {
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      phone: user.phone,
      passwordHash,
      favorites: Array.isArray(user.favorites) ? user.favorites : [],
      searching_history: Array.isArray(user.searching_history) ? user.searching_history : []
    }

    if (user.imgUrl && user.imgUrl.trim() !== '') {
      userToAdd.imgUrl = user.imgUrl
    }

    const collection = await dbService.getCollection('user')
    const res = await collection.insertOne(userToAdd)

    // החזרה בלי סיסמה
    return {
      _id: res.insertedId,
      firstName: userToAdd.firstName,
      lastName: userToAdd.lastName,
      username: userToAdd.username,
      email: userToAdd.email,
      phone: userToAdd.phone,
      imgUrl: userToAdd.imgUrl,
      favorites: userToAdd.favorites,
      searching_history: userToAdd.searching_history,
      createdAt: res.insertedId.getTimestamp?.() || new Date()
    }
  } catch (err) {
    logger.error('cannot add user', err)
    throw err
  }
}

function _buildCriteria(filterBy) {
  const criteria = {}
  if (filterBy.txt) {
    const txt = { $regex: filterBy.txt, $options: 'i' }
    criteria.$or = [
      { username: txt },
      { firstName: txt },
      { lastName: txt },
      { email: txt }
    ]
  }
  if (filterBy.phone) criteria.phone = filterBy.phone
  return criteria
}
