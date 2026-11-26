const express = require('express')
const Shipment = require('../models/Shipment')
const Container = require('../models/Container')

const router = express.Router()

// GET /api/track/:query - PUBLIC search by tracking ID or container ID (no login needed)
router.get('/:query', async (req, res, next) => {
  try {
    const q = req.params.query.trim()
    const shipment = await Shipment.findOne({
      $or: [
        { trackingId: { $regex: `^${q}$`, $options: 'i' } },
        { containerId: { $regex: `^${q}$`, $options: 'i' } },
      ],
    })
      .populate('ship', 'name imo company dockNumber status arrivalDate departureDate')
      .populate('owner', 'name role')

    if (!shipment) {
      return res.status(404).json({ message: 'No shipment found with this tracking ID or container ID' })
    }
    const container = await Container.findOne({ shipment: shipment._id })
    res.json({ shipment, container, statusSteps: Container.STATUS_STEPS })
  } catch (e) {
    next(e)
  }
})

module.exports = router
