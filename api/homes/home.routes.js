import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
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


// router.use(requireAuth)

router.get('/', log, getHomes)
router.get('/:id', log, getHomeById)
router.post('/', log, requireAuth, addHome)
router.put('/:id', requireAuth, updateHome)
router.delete('/:id', requireAuth, removeHome)
// router.delete('/:id', requireAuth, requireAdmin, removeHome)

router.post('/:id/msg', requireAuth, addMsg)
router.delete('/:id/msg/:msgId', requireAuth, removeMsg)

const homeRoutes = router

export default homeRoutes 
