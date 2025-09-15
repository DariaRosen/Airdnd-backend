import express from 'express'
import { log } from '../../middlewares/logger.middleware.js'

import {
  getHomes,
  getHomeById,
  addHome,
  updateHome,
  removeHome,
  addMsg,
  removeMsg
} from './home.controller.js'

const router = express.Router()

router.get('/', log, getHomes)
router.get('/:id', log, getHomeById)
router.post('/', log, addHome)
router.put('/:id', log, updateHome)
router.delete('/:id', log, removeHome)
router.post('/:id/msg', log, addMsg)
router.delete('/:id/msg/:msgId', log, removeMsg)

export default router
