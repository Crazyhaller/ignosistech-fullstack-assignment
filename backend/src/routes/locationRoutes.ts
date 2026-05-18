import { Router } from 'express'
import { getLocations } from '../controllers/locationController'

const router = Router()

router.get('/', getLocations)

export default router
