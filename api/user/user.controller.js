import { userService } from './user.service.js'
import { logger } from '../../services/logger.service.js'
import { ObjectId } from 'mongodb'

export async function getUser(req, res) {
  try {
    const { id } = req.params
    if (!ObjectId.isValid(id)) return res.status(400).send({ err: 'bad id' })

    const user = await userService.getById(id)
    if (!user) return res.status(404).send({ err: 'user not found' })

    res.status(200).send(user)
  } catch (err) {
    logger.error('Failed to get user', err)
    res.status(500).send({ err: 'server error' })
  }
}

export async function getUsers(req, res) {
  try {
    const page = Math.max(+req.query.page || 1, 1)
    const limit = Math.min(Math.max(+req.query.limit || 20, 1), 100)
    const txt = (req.query.txt || '').toString()

    const filterBy = { txt, page, limit }
    const users = await userService.query(filterBy)

    res.status(200).send(users)
  } catch (err) {
    logger.error('Failed to get users', err)
    res.status(500).send({ err: 'server error' })
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params
    if (!ObjectId.isValid(id)) return res.status(400).send({ err: 'bad id' })

    await userService.remove(id)
    res.status(204).end()
  } catch (err) {
    logger.error('Failed to delete user', err)
    res.status(500).send({ err: 'server error' })
  }
}

export async function updateUser(req, res) {
  try {
    const user = req.body
    if (!user?._id) return res.status(400).send({ err: 'missing _id' })

    const savedUser = await userService.update(user)
    if (!savedUser) return res.status(404).send({ err: 'user not found' })

    res.status(200).send(savedUser)
  } catch (err) {
    logger.error('Failed to update user', err)
    res.status(500).send({ err: 'server error' })
  }
}
