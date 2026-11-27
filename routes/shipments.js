const express = require('express')
const mongoose = require('mongoose')
const Shipment = require('../models/Shipment')
const Container = require('../models/Container')
const { protect } = require('../middleware/auth')

const router = express.Router()

// Generate a tracking ID like PT-2026-1042
async function generateTrackingId() {
  const year = new Date().getFullYear()
  let trackingId
  let exists = true
  while (exists) {
    const num = Math.floor(1000 + Math.random() * 9000)
    trackingId = `PT-${year}-${num}`
    exists = await Shipment.findOne({ trackingId })
  }
  return trackingId
}

// Importers/exporters only see their own shipments; admin sees all
function ownerFilter(req) {
  return req.user.role === 'admin' ? {} : { owner: req.user._id }
}

// GET /api/shipments?search=&type=
router.get('/', protect, async (req, res, next) => {
  try {
    const filter = { ...ownerFilter(req) }
    if (req.query.type) filter.type = req.query.type
    if (req.query.search) {
      const q = req.query.search.trim()
      filter.$or = [
        { trackingId: { $regex: q, $options: 'i' } },
        { containerId: { $regex: q, $options: 'i' } },
        { goodsType: { $regex: q, $options: 'i' } },
      ]
    }
    const shipments = await Shipment.find(filter)
      .populate('ship', 'name imo company dockNumber status')
      .populate('owner', 'name email role')
      .sort({ createdAt: -1 })
    res.json(shipments)
  } catch (e) {
    next(e)
  }
})

// GET /api/shipments/track/:trackingId - public, kept for backward compatibility
router.get('/track/:trackingId', async (req, res, next) => {
  try {
    const trackingId = req.params.trackingId.trim().toUpperCase()
    const shipment = await Shipment.findOne({ trackingId }).populate('ship', 'name imo company arrivalDate departureDate status')
    if (!shipment) return res.status(404).json({ message: 'No shipment found for this tracking ID' })
    const container = await Container.findOne({ shipment: shipment._id })
    res.json({ shipment, container })
  } catch (e) {
    next(e)
  }
})

// GET /api/shipments/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid shipment ID' })
    const shipment = await Shipment.findOne({ _id: req.params.id, ...ownerFilter(req) })
      .populate('ship', 'name imo company dockNumber status arrivalDate departureDate')
      .populate('owner', 'name email role')
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' })
    res.json(shipment)
  } catch (e) {
    next(e)
  }
})

// POST /api/shipments - creates the shipment and its container together
// Body: type, containerId, goodsType, origin, destination, ship, weight, trackingId (optional)
// Owner (admin only): `owner` = registered user id, OR `ownerName`/`ownerEmail` for an
// unregistered trader (shipment stays unclaimed until that email registers).
router.post('/', protect, async (req, res, next) => {
  try {
    const { type, containerId, goodsType, origin, destination, ship, weight } = req.body
    if (!type || !containerId || !goodsType || !origin || !destination) {
      return res.status(400).json({
        message: 'type, containerId, goodsType, origin and destination are required',
      })
    }
    if (!['import', 'export'].includes(type)) {
      return res.status(400).json({ message: 'type must be import or export' })
    }
    let owner = req.user._id
    let ownerName = ''
    let ownerEmail = ''
    if (req.user.role === 'admin') {
      if (req.body.owner) {
        owner = req.body.owner
      } else if (req.body.ownerName || req.body.ownerEmail) {
        owner = null
        ownerName = (req.body.ownerName || '').trim()
        ownerEmail = (req.body.ownerEmail || '').trim().toLowerCase()
      }
    }
    const trackingId = req.body.trackingId || (await generateTrackingId())

    const shipment = await Shipment.create({
      trackingId,
      type,
      containerId,
      goodsType,
      origin,
      destination,
      ship: ship || undefined,
      owner,
      ownerName,
      ownerEmail,
    })

    const container = await Container.create({
      containerId,
      shipment: shipment._id,
      // Container weight must be > 0; default to 1 when the form leaves it blank
      weight: Number(weight) > 0 ? Number(weight) : 1,
      goodsType,
      currentStatus: 'Booked',
      statusHistory: [{ status: 'Booked', date: new Date() }],
    })

    res.status(201).json({ shipment, container })
  } catch (e) {
    next(e)
  }
})

// PUT /api/shipments/:id
router.put('/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid shipment ID' })
    const body = { ...req.body }
    if (body.ship === '') body.ship = null
    if (body.owner === '') body.owner = null
    if (typeof body.ownerEmail === 'string') body.ownerEmail = body.ownerEmail.trim().toLowerCase()
    if (req.user.role !== 'admin') {
      delete body.owner
      delete body.ownerName
      delete body.ownerEmail
    }
    const shipment = await Shipment.findOneAndUpdate(
      { _id: req.params.id, ...ownerFilter(req) },
      body,
      { new: true, runValidators: true }
    ).populate('ship', 'name imo company')
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' })
    res.json(shipment)
  } catch (e) {
    next(e)
  }
})

// DELETE /api/shipments/:id - also deletes its container
router.delete('/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid shipment ID' })
    const shipment = await Shipment.findOneAndDelete({ _id: req.params.id, ...ownerFilter(req) })
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' })
    await Container.deleteMany({ shipment: shipment._id })
    res.json({ message: 'Shipment deleted successfully' })
  } catch (e) {
    next(e)
  }
})

module.exports = router
