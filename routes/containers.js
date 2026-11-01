const express = require('express')
const mongoose = require('mongoose')
const Container = require('../models/Container')
const Shipment = require('../models/Shipment')
const router = express.Router()

router.get('/', async (req, res, next) => {
  try { res.json(await Container.find().populate({ path: 'shipment', select: 'trackingId type origin destination' }).sort({ createdAt: -1 })) } catch (e) { next(e) }
})
router.post('/', async (req, res, next) => {
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
  } catch (e) { next(e) }
})
router.patch('/:id/status', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid container ID' })
    const { status } = req.body
    if (!Container.STATUS_STEPS.includes(status)) return res.status(400).json({ message: 'Invalid container status' })
    const container = await Container.findById(req.params.id)
    if (!container) return res.status(404).json({ message: 'Container not found' })
    container.currentStatus = status
    container.statusHistory.push({ status, date: new Date() })
    await container.save()
    res.json(container)
  } catch (e) { next(e) }
})
router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid container ID' })
    const container = await Container.findByIdAndDelete(req.params.id)
    if (!container) return res.status(404).json({ message: 'Container not found' })
    res.json({ message: 'Container deleted successfully' })
  } catch (e) { next(e) }
})
module.exports = router
