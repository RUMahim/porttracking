const express = require('express')
const mongoose = require('mongoose')
const Container = require('../models/Container')
const Shipment = require('../models/Shipment')
const Notification = require('../models/Notification')
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()
const STATUS_STEPS = Container.STATUS_STEPS

async function visibleShipmentIds(req) {
  if (req.user.role === 'admin') return null // all
  const mine = await Shipment.find({ owner: req.user._id }).select('_id')
  return mine.map((s) => s._id)
}

// GET /api/containers?status=
router.get('/', protect, async (req, res, next) => {
  try {
    const filter = {}
    const ids = await visibleShipmentIds(req)
    if (ids) filter.shipment = { $in: ids }
    if (req.query.status) filter.currentStatus = req.query.status
    const containers = await Container.find(filter)
      .populate({
        path: 'shipment',
        populate: [
          { path: 'ship', select: 'name imo dockNumber status' },
          { path: 'owner', select: 'name email role' },
        ],
      })
      .sort({ updatedAt: -1 })
    res.json(containers)
  } catch (e) {
    next(e)
  }
})

// GET /api/containers/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid container ID' })
    const ids = await visibleShipmentIds(req)
    const filter = { _id: req.params.id }
    if (ids) filter.shipment = { $in: ids }
    const container = await Container.findOne(filter).populate({
      path: 'shipment',
      populate: [
        { path: 'ship', select: 'name imo company dockNumber status arrivalDate departureDate' },
        { path: 'owner', select: 'name email role' },
      ],
    })
    if (!container) return res.status(404).json({ message: 'Container not found' })
    res.json(container)
  } catch (e) {
    next(e)
  }
})

// POST /api/containers - admin creates a container for an existing shipment
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const body = { ...req.body }
    body.containerId = String(body.containerId || '').trim().toUpperCase()
    if (!mongoose.isValidObjectId(body.shipment)) return res.status(400).json({ message: 'Select a valid shipment' })
    const shipment = await Shipment.findById(body.shipment)
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' })
    if (shipment.containerId.toUpperCase() !== body.containerId) {
      return res.status(400).json({ message: 'Container ID must match the selected shipment container ID' })
    }
    body.goodsType = body.goodsType || shipment.goodsType
    const container = await Container.create(body)
    res.status(201).json(await container.populate({ path: 'shipment', select: 'trackingId type origin destination' }))
  } catch (e) {
    next(e)
  }
})

// PUT or PATCH /api/containers/:id/status - admin updates status, owner gets a notification
async function updateStatus(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid container ID' })
    const { status } = req.body
    if (!STATUS_STEPS.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${STATUS_STEPS.join(', ')}` })
    }
    const container = await Container.findById(req.params.id).populate('shipment')
    if (!container) return res.status(404).json({ message: 'Container not found' })

    container.currentStatus = status
    container.statusHistory.push({ status, date: new Date() })
    await container.save()

    if (container.shipment && container.shipment.owner) {
      await Notification.create({
        user: container.shipment.owner,
        title: 'Container status updated',
        message: `Container ${container.containerId} (${container.shipment.trackingId}) is now: ${status}`,
        trackingId: container.shipment.trackingId,
        containerId: container.containerId,
      })
    }
    res.json(container)
  } catch (e) {
    next(e)
  }
}
router.put('/:id/status', protect, authorize('admin'), updateStatus)
router.patch('/:id/status', protect, authorize('admin'), updateStatus)

// PUT /api/containers/:id - admin edits weight/goodsType
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid container ID' })
    const { weight, goodsType } = req.body
    const container = await Container.findByIdAndUpdate(
      req.params.id,
      { weight, goodsType },
      { new: true, runValidators: true }
    )
    if (!container) return res.status(404).json({ message: 'Container not found' })
    res.json(container)
  } catch (e) {
    next(e)
  }
})

// DELETE /api/containers/:id - admin only
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid container ID' })
    const container = await Container.findByIdAndDelete(req.params.id)
    if (!container) return res.status(404).json({ message: 'Container not found' })
    res.json({ message: 'Container deleted successfully' })
  } catch (e) {
    next(e)
  }
})

module.exports = router
